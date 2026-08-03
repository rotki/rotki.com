package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

// spaManifestFile is emitted into the static output by the
// `nitro:build:public-assets` hook in packages/website/nuxt.config.ts.
const spaManifestFile = "spa-routes.json"

// nestedApp is a standalone SPA copied under the static root that owns its own
// subtree and serves its own index.html for deep links (e.g. the card-payment
// app mounted at /checkout/pay/card).
type nestedApp struct {
	Prefix string `json:"prefix"`
	Index  string `json:"index"`
}

// spaManifest lists the routes Nuxt deliberately leaves unrendered, so the
// handler knows which unmatched paths deserve the SPA shell and which are
// genuinely not found.
type spaManifest struct {
	SPAShell   string      `json:"spaShell"`
	NotFound   string      `json:"notFound"`
	SPARoutes  []string    `json:"spaRoutes"`
	NestedApps []nestedApp `json:"nestedApps"`
}

// staticHandler serves pre-rendered static files.
// For hashed assets (/_nuxt/*), it sets long-lived cache headers.
// For HTML files, it sets no-cache to allow CSP nonce injection.
//
// A path that does not resolve to a file on disk falls back to the SPA shell
// ONLY if it matches a route in the manifest; anything else gets a real 404.
// Serving the shell with 200 for every unmatched path makes the site a
// soft-404, which search engines penalise and which makes status-code-only
// vulnerability scanners report phantom findings for paths like /webcart/.
type staticHandler struct {
	root     string
	manifest spaManifest
	// notFoundBody is the prerendered 404 page, read once at startup. It is
	// tens of kilobytes, so re-reading it per request would put a syscall and
	// an allocation on every scanner sweep.
	notFoundBody []byte
}

func newStaticHandler(root string) (*staticHandler, error) {
	manifestPath := filepath.Join(root, spaManifestFile)
	raw, err := os.ReadFile(manifestPath) //nolint:gosec // G304: static root + constant filename, no user input
	if err != nil {
		// Fail loudly. Defaulting to "serve the shell for everything" would
		// silently reintroduce the soft-404 this manifest exists to prevent.
		return nil, fmt.Errorf("reading %s: %w", manifestPath, err)
	}

	var m spaManifest
	if err := json.Unmarshal(raw, &m); err != nil {
		return nil, fmt.Errorf("parsing %s: %w", manifestPath, err)
	}
	if m.SPAShell == "" || m.NotFound == "" {
		return nil, fmt.Errorf("%s: spaShell and notFound are required", manifestPath)
	}

	// The manifest naming a file is not enough: if the build dropped 200.html,
	// every client-only route (/login, /home/**, /oauth/**) would silently hard
	// 404. Check the referenced files exist rather than discovering it in prod.
	shellPath := filepath.Join(root, filepath.FromSlash(m.SPAShell))
	if _, err := os.Stat(shellPath); err != nil { //nolint:gosec // G703: static root + manifest-declared path
		return nil, fmt.Errorf("spaShell %s: %w", shellPath, err)
	}
	for _, app := range m.NestedApps {
		indexPath := filepath.Join(root, filepath.FromSlash(app.Index))
		if _, err := os.Stat(indexPath); err != nil { //nolint:gosec // G703: static root + manifest-declared path
			return nil, fmt.Errorf("nested app %s index %s: %w", app.Prefix, indexPath, err)
		}
	}

	body, bodyErr := os.ReadFile(filepath.Join(root, filepath.FromSlash(m.NotFound))) //nolint:gosec // G304: static root + manifest-declared path
	if bodyErr != nil {
		return nil, fmt.Errorf("notFound %s: %w", m.NotFound, bodyErr)
	}

	return &staticHandler{root: root, manifest: m, notFoundBody: body}, nil
}

// matchesRoute reports whether urlPath matches a manifest pattern. Patterns are
// either exact ("/login") or prefix wildcards ("/home/**"), covering the subset
// of Nitro's routeRules syntax that clientOnlyRoutes actually uses.
func matchesRoute(pattern, urlPath string) bool {
	if prefix := strings.TrimSuffix(pattern, "/**"); prefix != pattern {
		return urlPath == prefix || strings.HasPrefix(urlPath, prefix+"/")
	}
	return urlPath == pattern
}

// spaFallbackFor returns the file to serve for an unmatched path, or "" when the
// path should be a hard 404.
func (s *staticHandler) spaFallbackFor(urlPath string) string {
	// Nested apps first: they own their subtree, so a deep link inside one must
	// get that app's index.html rather than the Nuxt shell.
	for _, app := range s.manifest.NestedApps {
		if urlPath == app.Prefix || strings.HasPrefix(urlPath, app.Prefix+"/") {
			return app.Index
		}
	}
	for _, pattern := range s.manifest.SPARoutes {
		if matchesRoute(pattern, urlPath) {
			return s.manifest.SPAShell
		}
	}
	return ""
}

func (s *staticHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	urlPath := path.Clean(r.URL.Path)
	if urlPath == "" {
		urlPath = "/"
	}

	// Prevent path traversal
	if strings.Contains(urlPath, "..") {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// The SPA manifest lands in the static root because that is where the build
	// writes it, but it is a build artefact this handler reads from disk at
	// startup. Nothing fetches it over HTTP, so publishing the client-only
	// route list is surface area with no purpose.
	if urlPath == "/"+spaManifestFile {
		http.NotFound(w, r)
		return
	}

	// Try to serve the exact file
	filePath := filepath.Join(s.root, filepath.FromSlash(urlPath))

	info, err := os.Stat(filePath) //nolint:gosec // G703: path traversal prevented by ".." check above
	if err == nil {
		if info.IsDir() {
			// Try index.html inside the directory
			indexPath := filepath.Join(filePath, "index.html")
			if _, err := os.Stat(indexPath); err == nil { //nolint:gosec // G703: same path with "/index.html" appended
				s.serveFile(w, r, indexPath, urlPath)
				return
			}
		} else {
			s.serveFile(w, r, filePath, urlPath)
			return
		}
	}

	// File not found: if the path has an extension, it's a missing asset.
	// Assets get the bare text 404, not the ~50 KB HTML page. A browser holding
	// stale markup after a deploy re-requests old /_nuxt/<hash>.js chunks, and
	// answering each of those with the full 404 document would be a ~2500x
	// amplification of a response the client cannot parse anyway.
	if path.Ext(urlPath) != "" {
		http.NotFound(w, r)
		return
	}

	// SPA fallback, but only for routes Nuxt intentionally left unrendered.
	if fallback := s.spaFallbackFor(urlPath); fallback != "" {
		shellPath := filepath.Join(s.root, filepath.FromSlash(fallback))
		if _, err := os.Stat(shellPath); err == nil { //nolint:gosec // G703: static root + manifest-declared path
			s.serveFile(w, r, shellPath, urlPath)
			return
		}
	}

	s.serveNotFound(w, r)
}

// wantsHTML reports whether the client asked for an HTML representation.
//
// A browser navigating to a page always lists text/html in Accept. Automated
// clients — scanners, uptime probes, `curl`, and `fetch()` — send `*/*` or omit
// the header entirely, and none of them render the page they get back.
func wantsHTML(r *http.Request) bool {
	for _, accept := range r.Header.Values("Accept") {
		for media := range strings.SplitSeq(accept, ",") {
			// Drop parameters (";q=0.9", ";charset=...") and compare the type.
			mediaType, _, _ := strings.Cut(media, ";")
			switch strings.ToLower(strings.TrimSpace(mediaType)) {
			case "text/html", "application/xhtml+xml":
				return true
			}
		}
	}
	return false
}

// serveNotFound writes the pre-rendered 404 page with a real 404 status.
// http.ServeContent cannot be used here: it always writes 200 and negotiates
// Range/If-Modified-Since, so the body is written directly instead.
//
// Clients that did not ask for HTML get the bare text body instead. The
// pre-rendered page is ~47 KB and uncacheable, and it flows through the CSP
// middleware, which buffers and rewrites it on every request. Sweeps of
// nonexistent paths are almost entirely non-browser traffic, so answering them
// with the full document turns a ~100 byte request into tens of kilobytes of
// response plus a buffer, a scan and a compression pass, for a body nothing
// will ever display. The status code is identical either way, so crawlers and
// SEO are unaffected.
func (s *staticHandler) serveNotFound(w http.ResponseWriter, r *http.Request) {
	if !wantsHTML(r) {
		http.NotFound(w, r)
		return
	}

	// Content-Length is left to net/http: the CSP middleware rewrites this body
	// to inject nonces, so a length set here would be stale.
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.WriteHeader(http.StatusNotFound)
	if r.Method != http.MethodHead {
		_, _ = w.Write(s.notFoundBody)
	}
}

func (s *staticHandler) serveFile(w http.ResponseWriter, r *http.Request, filePath string, urlPath string) {
	// Set cache headers based on path
	switch {
	case strings.HasPrefix(urlPath, "/_nuxt/"), strings.HasPrefix(urlPath, "/_fonts/"):
		// Content-hashed filenames, so a change always arrives under a new URL.
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")

	case strings.HasSuffix(filePath, ".html"):
		// HTML: no cache (allows nonce injection to work properly)
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")

	default:
		// Everything copied verbatim from public/: /img, favicons, manifests.
		// These carry no Cache-Control at all today, so a browser revalidates
		// them on every navigation even though they almost never change.
		//
		// Their filenames are stable rather than content-hashed, so "immutable"
		// would strand a replaced asset in caches for a year. A short fresh
		// window plus a long stale-while-revalidate keeps navigation request
		// free while still letting a deploy propagate within the hour.
		w.Header().Set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400")
	}

	f, err := os.Open(filePath) //nolint:gosec // G304: path validated by ServeHTTP (rejects ".." paths)
	if err != nil {
		s.serveNotFound(w, r)
		return
	}
	defer func() { _ = f.Close() }()

	stat, err := f.Stat()
	if err != nil {
		s.serveNotFound(w, r)
		return
	}

	http.ServeContent(w, r, filePath, stat.ModTime(), f)
}

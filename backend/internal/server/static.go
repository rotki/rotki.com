package server

import (
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

// staticHandler serves pre-rendered static files with SPA fallback.
// For hashed assets (/_nuxt/*), it sets long-lived cache headers.
// For HTML files, it sets no-cache to allow CSP nonce injection.
// If a file is not found and the path has no extension, it walks up
// the directory tree looking for the nearest index.html (SPA fallback).
type staticHandler struct {
	root string
}

func newStaticHandler(root string) *staticHandler {
	return &staticHandler{root: root}
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

	// File not found — if the path has an extension, it's a missing asset
	if path.Ext(urlPath) != "" {
		http.NotFound(w, r)
		return
	}

	// SPA fallback: walk up the directory tree for the nearest index.html
	fallback := s.findFallbackIndex(urlPath)
	if fallback != "" {
		s.serveFile(w, r, fallback, urlPath)
		return
	}

	// Last resort: root index.html
	rootIndex := filepath.Join(s.root, "index.html")
	if _, err := os.Stat(rootIndex); err == nil { //nolint:gosec // G703: static root + "index.html", no user input
		s.serveFile(w, r, rootIndex, urlPath)
		return
	}

	http.NotFound(w, r)
}

// findFallbackIndex walks up from the given URL path looking for index.html.
// For example, /activate/uid123/token456 tries:
//  1. <root>/activate/uid123/token456/index.html
//  2. <root>/activate/uid123/index.html
//  3. <root>/activate/index.html
func (s *staticHandler) findFallbackIndex(urlPath string) string {
	current := urlPath
	for current != "/" && current != "." {
		candidate := filepath.Join(s.root, filepath.FromSlash(current), "index.html")
		if _, err := os.Stat(candidate); err == nil { //nolint:gosec // G703: path traversal prevented by ServeHTTP (rejects "..")
			return candidate
		}
		current = path.Dir(current)
	}
	return ""
}

func (s *staticHandler) serveFile(w http.ResponseWriter, r *http.Request, filePath string, urlPath string) {
	// Set cache headers based on path
	if strings.HasPrefix(urlPath, "/_nuxt/") {
		// Hashed assets — cache for 1 year
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	} else if strings.HasSuffix(filePath, ".html") {
		// HTML — no cache (allows nonce injection to work properly)
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	}

	f, err := os.Open(filePath) //nolint:gosec // G304: path validated by ServeHTTP (rejects ".." paths)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer func() { _ = f.Close() }()

	stat, err := f.Stat()
	if err != nil {
		http.NotFound(w, r)
		return
	}

	http.ServeContent(w, r, filePath, stat.ModTime(), f)
}

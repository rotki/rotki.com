package server

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/rotki/rotki.com/backend/internal/validate"
)

func TestHandleHealth(t *testing.T) {
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	handleHealth(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("Content-Type = %q, want application/json", ct)
	}

	var body map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if body["status"] != "ok" {
		t.Fatalf("status = %q, want ok", body["status"])
	}
	if _, ok := body["version"]; !ok {
		t.Fatal("missing version field")
	}
	if _, ok := body["git_sha"]; !ok {
		t.Fatal("missing git_sha field")
	}
}

func TestIsLoopback(t *testing.T) {
	tests := []struct {
		ip   string
		want bool
	}{
		{"127.0.0.1", true},
		{"::1", true},
		{"127.0.0.2", true},
		{"192.168.1.1", false},
		{"10.0.0.1", false},
		{"", false},
		{"invalid", false},
	}

	for _, tt := range tests {
		t.Run(tt.ip, func(t *testing.T) {
			got := isLoopback(tt.ip)
			if got != tt.want {
				t.Errorf("isLoopback(%q) = %v, want %v", tt.ip, got, tt.want)
			}
		})
	}
}

func TestClientIP(t *testing.T) {
	tests := []struct {
		name       string
		xff        string
		xri        string
		remoteAddr string
		want       string
	}{
		{
			name:       "X-Forwarded-For with single IP",
			xff:        "1.2.3.4",
			remoteAddr: "5.6.7.8:1234",
			want:       "1.2.3.4",
		},
		{
			name:       "X-Forwarded-For with chain",
			xff:        "1.2.3.4, 10.0.0.1, 10.0.0.2",
			remoteAddr: "5.6.7.8:1234",
			want:       "1.2.3.4",
		},
		{
			name:       "X-Real-IP",
			xri:        "9.8.7.6",
			remoteAddr: "5.6.7.8:1234",
			want:       "9.8.7.6",
		},
		{
			name:       "RemoteAddr fallback",
			remoteAddr: "5.6.7.8:1234",
			want:       "5.6.7.8",
		},
		{
			name:       "RemoteAddr IPv6",
			remoteAddr: "[::1]:1234",
			want:       "::1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/", nil)
			r.RemoteAddr = tt.remoteAddr
			if tt.xff != "" {
				r.Header.Set("X-Forwarded-For", tt.xff)
			}
			if tt.xri != "" {
				r.Header.Set("X-Real-IP", tt.xri)
			}

			got := validate.ClientIP(r)
			if got != tt.want {
				t.Errorf("clientIP() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestClientIP_InvalidXFF(t *testing.T) {
	r := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/", nil)
	r.RemoteAddr = "5.6.7.8:1234"
	r.Header.Set("X-Forwarded-For", "not-an-ip, 1.2.3.4")

	got := validate.ClientIP(r)
	// Invalid IP in XFF is rejected, falls through to RemoteAddr
	if got != "5.6.7.8" {
		t.Errorf("clientIP() = %q, want 5.6.7.8 (fallback to RemoteAddr)", got)
	}
}

// --- Security headers tests ---

func TestSecurityHeaders(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := securityHeaders(inner)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	expectedHeaders := map[string]string{
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options":        "DENY",
		"X-XSS-Protection":       "0",
		"Referrer-Policy":        "strict-origin-when-cross-origin",
	}

	for header, want := range expectedHeaders {
		got := rec.Header().Get(header)
		if got != want {
			t.Errorf("header %s = %q, want %q", header, got, want)
		}
	}

	pp := rec.Header().Get("Permissions-Policy")
	if pp == "" {
		t.Error("expected Permissions-Policy header to be set")
	}
}

// --- Recovery middleware tests ---

func TestRecovery_NoPanic(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	logger := testLogger()
	handler := recovery(inner, logger)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestRecovery_CatchesPanic(t *testing.T) {
	inner := http.HandlerFunc(func(_ http.ResponseWriter, _ *http.Request) {
		panic("test panic")
	})

	logger := testLogger()
	handler := recovery(inner, logger)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 after panic, got %d", rec.Code)
	}
}

// --- Static handler tests ---

func setupStaticDir(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()

	// root index.html
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("<html>root</html>"), 0o644); err != nil { //nolint:gosec // G306: test fixture, 0644 is fine
		t.Fatal(err)
	}

	// 200.html (SPA fallback shell)
	if err := os.WriteFile(filepath.Join(dir, "200.html"), []byte("<html>spa-shell</html>"), 0o644); err != nil { //nolint:gosec // G306: test fixture, 0644 is fine
		t.Fatal(err)
	}

	// _nuxt/app.js (hashed asset)
	nuxtDir := filepath.Join(dir, "_nuxt")
	if err := os.MkdirAll(nuxtDir, 0o755); err != nil { //nolint:gosec // G301: test temp dir, 0755 is fine
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(nuxtDir, "app.abc123.js"), []byte("console.log('app')"), 0o644); err != nil { //nolint:gosec // G306: test fixture, 0644 is fine
		t.Fatal(err)
	}

	// activate/index.html (SPA route)
	activateDir := filepath.Join(dir, "activate")
	if err := os.MkdirAll(activateDir, 0o755); err != nil { //nolint:gosec // G301: test temp dir, 0755 is fine
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(activateDir, "index.html"), []byte("<html>activate</html>"), 0o644); err != nil { //nolint:gosec // G306: test fixture, 0644 is fine
		t.Fatal(err)
	}

	// not-found/index.html (prerendered 404 body; a nested path, matching what
	// the real manifest points at)
	notFoundDir := filepath.Join(dir, "not-found")
	if err := os.MkdirAll(notFoundDir, 0o755); err != nil { //nolint:gosec // G301: test temp dir, 0755 is fine
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(notFoundDir, "index.html"), []byte("<html>not-found</html>"), 0o644); err != nil { //nolint:gosec // G306: test fixture, 0644 is fine
		t.Fatal(err)
	}

	// checkout/pay/card/index.html (nested standalone SPA)
	cardDir := filepath.Join(dir, "checkout", "pay", "card")
	if err := os.MkdirAll(cardDir, 0o755); err != nil { //nolint:gosec // G301: test temp dir, 0755 is fine
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(cardDir, "index.html"), []byte("<html>card-app</html>"), 0o644); err != nil { //nolint:gosec // G306: test fixture, 0644 is fine
		t.Fatal(err)
	}

	// spa-routes.json, mirroring what the Nuxt build hook emits.
	manifest := `{
  "spaShell": "200.html",
  "notFound": "not-found/index.html",
  "spaRoutes": ["/home/**", "/login", "/oauth/**", "/activate/**", "/checkout/success"],
  "nestedApps": [{"prefix": "/checkout/pay/card", "index": "checkout/pay/card/index.html"}]
}`
	if err := os.WriteFile(filepath.Join(dir, spaManifestFile), []byte(manifest), 0o644); err != nil { //nolint:gosec // G306: test fixture, 0644 is fine
		t.Fatal(err)
	}

	return dir
}

func newTestStaticHandler(t *testing.T, dir string) *staticHandler {
	t.Helper()
	h, err := newStaticHandler(dir)
	if err != nil {
		t.Fatalf("newStaticHandler: %v", err)
	}
	return h
}

func TestStaticHandler_ServeRootIndex(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	if cc := rec.Header().Get("Cache-Control"); cc != "no-cache, no-store, must-revalidate" {
		t.Errorf("expected no-cache for HTML, got %q", cc)
	}
}

func TestStaticHandler_ServeHashedAsset(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/_nuxt/app.abc123.js", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	cc := rec.Header().Get("Cache-Control")
	if cc != "public, max-age=31536000, immutable" {
		t.Errorf("expected immutable cache for nuxt assets, got %q", cc)
	}
}

func TestStaticHandler_SPAFallback(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	// /activate/uid123/token456 should fall back to 200.html (SPA shell)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/activate/uid123/token456", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 from SPA fallback, got %d", rec.Code)
	}
	if body := rec.Body.String(); body != "<html>spa-shell</html>" {
		t.Errorf("expected 200.html SPA shell content, got %q", body)
	}
}

// Unmatched extensionless paths must be a hard 404, not the SPA shell with 200.
// A soft-404 is an SEO penalty and makes status-code-only vulnerability scanners
// report phantom findings (e.g. CVE-1999-0610 against /webcart/).
func TestStaticHandler_UnmatchedRouteHard404(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	paths := []string{
		"/unknown-page",
		"/webcart/",
		"/webcart/orders/",
		"/webcart/config/",
		"/cgi-bin/",
		"/scripts/",
		"/cgi-bin/wsisa.dll/WService=wsbroker1/",
		"/zzz-nonexistent/deeply/nested",
	}

	for _, p := range paths {
		t.Run(p, func(t *testing.T) {
			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, p, nil)
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)

			if rec.Code != http.StatusNotFound {
				t.Errorf("expected 404, got %d", rec.Code)
			}
			if body := rec.Body.String(); body != "<html>not-found</html>" {
				t.Errorf("expected 404.html content, got %q", body)
			}
			if ct := rec.Header().Get("Content-Type"); !strings.HasPrefix(ct, "text/html") {
				t.Errorf("Content-Type = %q, want text/html", ct)
			}
		})
	}
}

// Routes Nuxt deliberately leaves unrendered still need the SPA shell at 200,
// otherwise auth, OAuth callbacks and checkout break.
func TestStaticHandler_ManifestRoutesServeShell(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	paths := []string{
		"/home/subscription",
		"/home",
		"/login",
		"/oauth/callback",
		"/checkout/success",
	}

	for _, p := range paths {
		t.Run(p, func(t *testing.T) {
			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, p, nil)
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Errorf("expected 200, got %d", rec.Code)
			}
			if body := rec.Body.String(); body != "<html>spa-shell</html>" {
				t.Errorf("expected SPA shell, got %q", body)
			}
		})
	}
}

// The card-payment app owns its subtree, so deep links inside it must get that
// app's own index.html rather than the Nuxt shell.
func TestStaticHandler_NestedAppFallback(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	for _, p := range []string{"/checkout/pay/card", "/checkout/pay/card/confirm"} {
		t.Run(p, func(t *testing.T) {
			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, p, nil)
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Errorf("expected 200, got %d", rec.Code)
			}
			if body := rec.Body.String(); body != "<html>card-app</html>" {
				t.Errorf("expected card app index, got %q", body)
			}
		})
	}
}

// A missing or malformed manifest must fail startup. Falling back to
// "serve the shell for everything" would silently restore the soft-404.
func TestNewStaticHandler_ManifestRequired(t *testing.T) {
	t.Run("missing", func(t *testing.T) {
		dir := t.TempDir()
		if _, err := newStaticHandler(dir); err == nil {
			t.Fatal("expected error when spa-routes.json is absent")
		}
	})

	t.Run("malformed", func(t *testing.T) {
		dir := t.TempDir()
		if err := os.WriteFile(filepath.Join(dir, spaManifestFile), []byte("{not json"), 0o644); err != nil { //nolint:gosec // G306: test fixture, 0644 is fine
			t.Fatal(err)
		}
		if _, err := newStaticHandler(dir); err == nil {
			t.Fatal("expected error for malformed manifest")
		}
	})

	t.Run("missing required fields", func(t *testing.T) {
		dir := t.TempDir()
		if err := os.WriteFile(filepath.Join(dir, spaManifestFile), []byte(`{"spaRoutes":[]}`), 0o644); err != nil { //nolint:gosec // G306: test fixture, 0644 is fine
			t.Fatal(err)
		}
		if _, err := newStaticHandler(dir); err == nil {
			t.Fatal("expected error when spaShell/notFound are absent")
		}
	})
}

func TestMatchesRoute(t *testing.T) {
	tests := []struct {
		pattern string
		path    string
		want    bool
	}{
		{"/login", "/login", true},
		{"/login", "/login/extra", false},
		{"/login", "/logins", false},
		{"/home/**", "/home", true},
		{"/home/**", "/home/subscription", true},
		{"/home/**", "/home/a/b/c", true},
		{"/home/**", "/homepage", false},
		{"/oauth/**", "/oauth/callback", true},
		{"/oauth/**", "/webcart/", false},
	}

	for _, tt := range tests {
		t.Run(tt.pattern+" vs "+tt.path, func(t *testing.T) {
			if got := matchesRoute(tt.pattern, tt.path); got != tt.want {
				t.Errorf("matchesRoute(%q, %q) = %v, want %v", tt.pattern, tt.path, got, tt.want)
			}
		})
	}
}

func TestStaticHandler_MissingAsset404(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/missing.css", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404 for missing asset, got %d", rec.Code)
	}
}

// Missing assets must NOT get the full 404 document. After a deploy, clients
// re-request stale /_nuxt/<hash>.js chunks, and the HTML page is ~50 KB of
// content they cannot parse.
func TestStaticHandler_MissingAssetGetsBareBody(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	for _, p := range []string{"/missing.css", "/_nuxt/stale.abc123.js", "/gone.txt"} {
		t.Run(p, func(t *testing.T) {
			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, p, nil)
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)

			if rec.Code != http.StatusNotFound {
				t.Errorf("expected 404, got %d", rec.Code)
			}
			if strings.Contains(rec.Body.String(), "not-found") {
				t.Errorf("asset 404 served the full HTML page (%d bytes); want the bare body", rec.Body.Len())
			}
		})
	}
}

// A manifest naming files that are not on disk must fail startup, otherwise
// every client-only route silently hard-404s in production.
func TestNewStaticHandler_ReferencedFilesMustExist(t *testing.T) {
	write := func(t *testing.T, dir, name, content string) {
		t.Helper()
		full := filepath.Join(dir, name)
		if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil { //nolint:gosec // G301: test temp dir, 0755 is fine
			t.Fatal(err)
		}
		if err := os.WriteFile(full, []byte(content), 0o644); err != nil { //nolint:gosec // G306: test fixture, 0644 is fine
			t.Fatal(err)
		}
	}

	manifest := `{
  "spaShell": "200.html",
  "notFound": "not-found/index.html",
  "spaRoutes": ["/login"],
  "nestedApps": [{"prefix": "/checkout/pay/card", "index": "checkout/pay/card/index.html"}]
}`

	tests := []struct {
		name    string
		present []string
	}{
		{"missing spaShell", []string{"not-found/index.html", "checkout/pay/card/index.html"}},
		{"missing notFound", []string{"200.html", "checkout/pay/card/index.html"}},
		{"missing nested app index", []string{"200.html", "not-found/index.html"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := t.TempDir()
			write(t, dir, spaManifestFile, manifest)
			for _, f := range tt.present {
				write(t, dir, f, "<html></html>")
			}
			if _, err := newStaticHandler(dir); err == nil {
				t.Fatal("expected startup to fail when a manifest-referenced file is absent")
			}
		})
	}
}

func TestStaticHandler_PathTraversalBlocked(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	// path.Clean normalizes /../ to /, so traversal via URL path is blocked
	// by Go's http library. Verify that even if someone crafts a URL.Path
	// with "..", the handler's explicit check catches it.
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/test", nil)
	req.URL.Path = "/subdir/../../../etc/passwd"

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	// path.Clean resolves this to /etc/passwd (no .. left), so the check
	// won't fire, but the file won't exist under root → falls through to
	// SPA fallback → serves root index.html. The key security property is
	// that filepath.Join(root, cleaned_path) cannot escape root.
	// Verify the response does NOT contain /etc/passwd content.
	body := rec.Body.String()
	if strings.Contains(body, "root:") {
		t.Error("path traversal: served /etc/passwd content")
	}
}

func TestStaticHandler_MethodNotAllowed(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	for _, method := range []string{http.MethodPost, http.MethodPut, http.MethodDelete} {
		req := httptest.NewRequestWithContext(context.Background(), method, "/", nil)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)

		if rec.Code != http.StatusMethodNotAllowed {
			t.Errorf("%s: expected 405, got %d", method, rec.Code)
		}
	}
}

func TestStaticHandler_HeadMethod(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodHead, "/", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 for HEAD, got %d", rec.Code)
	}
	if rec.Body.Len() != 0 {
		t.Error("expected empty body for HEAD request")
	}
}

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
}

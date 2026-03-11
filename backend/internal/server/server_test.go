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

	return dir
}

func TestStaticHandler_ServeRootIndex(t *testing.T) {
	dir := setupStaticDir(t)
	h := newStaticHandler(dir)

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
	h := newStaticHandler(dir)

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
	h := newStaticHandler(dir)

	// /activate/uid123/token456 should fall back to /activate/index.html
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/activate/uid123/token456", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 from SPA fallback, got %d", rec.Code)
	}
	if body := rec.Body.String(); body != "<html>activate</html>" {
		t.Errorf("expected activate index.html content, got %q", body)
	}
}

func TestStaticHandler_RootFallback(t *testing.T) {
	dir := setupStaticDir(t)
	h := newStaticHandler(dir)

	// /unknown-page should fall back to root index.html
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/unknown-page", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 from root fallback, got %d", rec.Code)
	}
}

func TestStaticHandler_MissingAsset404(t *testing.T) {
	dir := setupStaticDir(t)
	h := newStaticHandler(dir)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/missing.css", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404 for missing asset, got %d", rec.Code)
	}
}

func TestStaticHandler_PathTraversalBlocked(t *testing.T) {
	dir := setupStaticDir(t)
	h := newStaticHandler(dir)

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
	h := newStaticHandler(dir)

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
	h := newStaticHandler(dir)

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

package server

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	cspmod "github.com/rotki/rotki.com/backend/internal/csp"
)

// Clients that never render HTML must not be handed the full 404 document.
// It is ~47 KB in production, uncacheable, and rewritten per request by the CSP
// middleware, so serving it to scanners and probes is pure cost for a body that
// is discarded.
func TestStaticHandler_NonBrowser404GetsBareBody(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	cases := []struct {
		name   string
		accept string
	}{
		{"no accept header", ""},
		{"wildcard", "*/*"},
		{"curl default", "*/*"},
		{"json client", "application/json"},
		{"image probe", "image/webp,image/apng"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/zzz-nonexistent", nil)
			if tc.accept != "" {
				req.Header.Set("Accept", tc.accept)
			}
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)

			// The status is what crawlers and monitoring act on, and it is
			// unchanged. Only the body differs.
			if rec.Code != http.StatusNotFound {
				t.Errorf("expected 404, got %d", rec.Code)
			}
			if strings.Contains(rec.Body.String(), "not-found") {
				t.Errorf("served the full HTML page (%d bytes) to a non-HTML client", rec.Body.Len())
			}
		})
	}
}

// Browsers must keep getting the designed page.
func TestStaticHandler_BrowserStillGets404Page(t *testing.T) {
	dir := setupStaticDir(t)
	h := newTestStaticHandler(t, dir)

	// Real Accept headers, as sent by Firefox, Chrome and Googlebot.
	accepts := []string{
		"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
		"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		"application/xhtml+xml",
	}

	for i, accept := range accepts {
		t.Run(fmt.Sprintf("accept-%d", i), func(t *testing.T) {
			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/zzz-nonexistent", nil)
			req.Header.Set("Accept", accept)
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)

			if rec.Code != http.StatusNotFound {
				t.Errorf("expected 404, got %d", rec.Code)
			}
			if body := rec.Body.String(); body != "<html>not-found</html>" {
				t.Errorf("expected the 404 page, got %q", body)
			}
		})
	}
}

func TestWantsHTML(t *testing.T) {
	cases := []struct {
		accept string
		want   bool
	}{
		{"text/html", true},
		{"TEXT/HTML", true},
		{"text/html;q=0.9", true},
		{" text/html , */* ", true},
		{"application/xhtml+xml", true},
		{"application/xml;q=0.9,*/*;q=0.8", false},
		{"*/*", false},
		{"application/json", false},
		{"", false},
		// Substring matches must not count: these are distinct media types.
		{"text/htmlish", false},
		{"application/text/html-fragment", false},
	}

	for _, tc := range cases {
		t.Run(tc.accept, func(t *testing.T) {
			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/", nil)
			if tc.accept != "" {
				req.Header.Set("Accept", tc.accept)
			}
			if got := wantsHTML(req); got != tc.want {
				t.Errorf("wantsHTML(%q) = %v, want %v", tc.accept, got, tc.want)
			}
		})
	}
}

// setupLargeNotFoundDir mirrors setupStaticDir but with a 404 body sized like
// the real one, so the benchmark measures the cost that actually matters.
func setupLargeNotFoundDir(tb testing.TB, bodySize int) string {
	tb.Helper()
	dir := tb.TempDir()

	write := func(name, content string) {
		tb.Helper()
		full := filepath.Join(dir, name)
		if err := os.MkdirAll(filepath.Dir(full), 0o750); err != nil {
			tb.Fatal(err)
		}
		if err := os.WriteFile(full, []byte(content), 0o644); err != nil { //nolint:gosec // G306: test fixture
			tb.Fatal(err)
		}
	}

	// Shape the body like the real page: markup with a couple of inline
	// scripts, so the CSP middleware has something to find when it scans.
	var sb strings.Builder
	sb.WriteString(`<html><head><script>window.__NUXT__={}</script>`)
	sb.WriteString(`<link rel="modulepreload" href="/_nuxt/entry.js">`)
	sb.WriteString("</head><body>")
	for sb.Len() < bodySize {
		sb.WriteString(`<div class="prose"><p>not found</p></div>`)
	}
	sb.WriteString(`<script>console.log(1)</script></body></html>`)

	write("index.html", "<html>root</html>")
	write("200.html", "<html>spa-shell</html>")
	write("not-found/index.html", sb.String())
	write(spaManifestFile, `{
  "spaShell": "200.html",
  "notFound": "not-found/index.html",
  "spaRoutes": ["/login"],
  "nestedApps": []
}`)

	return dir
}

// BenchmarkNotFound measures a 404 through the same middleware chain
// production uses, so the CSP buffer-and-rewrite pass is included.
//
// Browser and NonBrowser differ only in the Accept header.
func BenchmarkNotFound(b *testing.B) {
	const realisticBodySize = 47 * 1024

	dir := setupLargeNotFoundDir(b, realisticBodySize)
	h, err := newStaticHandler(dir)
	if err != nil {
		b.Fatalf("newStaticHandler: %v", err)
	}
	handler := cspmod.Middleware(h)

	cases := []struct {
		name   string
		accept string
	}{
		{"Browser", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"},
		{"NonBrowser", "*/*"},
	}

	for _, tc := range cases {
		b.Run(tc.name, func(b *testing.B) {
			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/zzz-nonexistent", nil)
			req.Header.Set("Accept", tc.accept)

			b.ReportAllocs()
			b.ResetTimer()
			for range b.N {
				rec := httptest.NewRecorder()
				handler.ServeHTTP(rec, req)
				b.SetBytes(int64(rec.Body.Len()))
			}
		})
	}
}

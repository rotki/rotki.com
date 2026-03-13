package csp

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestInjectNonce(t *testing.T) {
	html := []byte(`<html><head><script src="/app.js"></script><link rel="modulepreload" href="/chunk.js"></head></html>`)
	result := injectNonce(html, "testNonce123")

	s := string(result)
	if !strings.Contains(s, `<script nonce="testNonce123" src="/app.js">`) {
		t.Fatalf("nonce not injected into script tag: %s", s)
	}
	if !strings.Contains(s, `<link nonce="testNonce123" rel="modulepreload"`) {
		t.Fatalf("nonce not injected into modulepreload link: %s", s)
	}
}

func TestInjectNonceSkipsExisting(t *testing.T) {
	html := []byte(`<script nonce="existing123" src="/app.js"></script>`)
	result := injectNonce(html, "newNonce")

	s := string(result)
	if strings.Contains(s, "newNonce") {
		t.Fatalf("should not override existing nonce: %s", s)
	}
	if !strings.Contains(s, "existing123") {
		t.Fatalf("should preserve existing nonce: %s", s)
	}
}

func TestInjectNonceMultipleScripts(t *testing.T) {
	html := []byte(`<script src="/a.js"></script><script src="/b.js"></script>`)
	result := injectNonce(html, "n1")

	count := bytes.Count(result, []byte(`nonce="n1"`))
	if count != 2 {
		t.Fatalf("expected 2 nonce injections, got %d in: %s", count, string(result))
	}
}

func TestInjectNonceSkipsNonModulepreloadLinks(t *testing.T) {
	html := []byte(`<link rel="stylesheet" href="/style.css"><link rel="modulepreload" href="/mod.js">`)
	result := injectNonce(html, "n1")

	s := string(result)
	if strings.Contains(s, `<link nonce="n1" rel="stylesheet"`) {
		t.Fatalf("should not inject nonce into stylesheet link: %s", s)
	}
	if !strings.Contains(s, `<link nonce="n1" rel="modulepreload"`) {
		t.Fatalf("should inject nonce into modulepreload link: %s", s)
	}
}

func TestShouldInjectCSP(t *testing.T) {
	tests := []struct {
		path string
		want bool
	}{
		{"/", true},
		{"/signup", true},
		{"/checkout/pay", true},
		{"/sponsor/tier1", true},
		{"/activate/uid/token", true},
		{"/api/releases/latest", false},
		{"/api/csp/violation", false},
		{"/_nuxt/app-abc123.js", false},
		{"/favicon.ico", false},
		{"/style.css", false},
		{"/robots.txt", false},
		{"/site.webmanifest", false},
		{"/image.png", false},
		{"/font.woff2", false},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			got := shouldInjectCSP(tt.path)
			if got != tt.want {
				t.Errorf("shouldInjectCSP(%q) = %v, want %v", tt.path, got, tt.want)
			}
		})
	}
}

func TestMiddlewareInjectsCSPHeader(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`<html><head><script src="/app.js"></script></head><body>Hello</body></html>`))
	})

	handler := Middleware(inner)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/signup", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	cspHeader := rec.Header().Get("Content-Security-Policy")
	if cspHeader == "" {
		t.Fatal("missing Content-Security-Policy header")
	}

	// Should contain recaptcha sources for /signup
	if !strings.Contains(cspHeader, "recaptcha") {
		t.Fatalf("CSP for /signup should include recaptcha: %s", cspHeader)
	}

	// Should contain a nonce
	if !strings.Contains(cspHeader, "'nonce-") {
		t.Fatalf("CSP should contain nonce: %s", cspHeader)
	}

	// Body should have nonce injected
	body := rec.Body.String()
	if !strings.Contains(body, "nonce=") {
		t.Fatalf("body should have nonce injected: %s", body)
	}
}

func TestMiddlewareDefaultCSP(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`<html><body>Home</body></html>`))
	})

	handler := Middleware(inner)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	cspHeader := rec.Header().Get("Content-Security-Policy")
	if cspHeader == "" {
		t.Fatal("missing CSP header")
	}
	// Default CSP should have script-src with self
	if !strings.Contains(cspHeader, "script-src") {
		t.Fatalf("default CSP missing script-src: %s", cspHeader)
	}
}

func TestMiddlewareSkipsNonHTML(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	handler := Middleware(inner)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/releases/latest", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Header().Get("Content-Security-Policy") != "" {
		t.Fatal("should not set CSP for API routes")
	}
}

func TestMiddlewareRouteOverrideHeaders(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`<html><body>Crypto</body></html>`))
	})

	handler := Middleware(inner)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/checkout/pay/crypto", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	// /checkout/pay/crypto should have COOP: unsafe-none
	if coop := rec.Header().Get("Cross-Origin-Opener-Policy"); coop != "unsafe-none" {
		t.Fatalf("COOP = %q, want unsafe-none", coop)
	}
}

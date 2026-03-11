package proxy

import (
	"context"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestNewDevServer_Empty(t *testing.T) {
	t.Parallel()
	ds := NewDevServer("", slog.Default())
	if ds != nil {
		t.Error("expected nil for empty URL")
	}
}

func TestNewDevServer_InvalidURL(t *testing.T) {
	t.Parallel()
	ds := NewDevServer("://bad", slog.Default())
	if ds != nil {
		t.Error("expected nil for invalid URL")
	}
}

func TestDevServer_ProxiesRequests(t *testing.T) {
	t.Parallel()

	// Fake Nuxt dev server
	nuxt := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("X-Test", "nuxt-dev")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("hello from nuxt"))
	}))
	defer nuxt.Close()

	ds := NewDevServer(nuxt.URL, slog.Default())
	if ds == nil {
		t.Fatal("expected non-nil DevServer")
	}

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/some/page", nil)
	rr := httptest.NewRecorder()
	ds.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("got status %d, want 200", rr.Code)
	}
	if got := rr.Body.String(); got != "hello from nuxt" {
		t.Errorf("got body %q, want %q", got, "hello from nuxt")
	}
	if got := rr.Header().Get("X-Test"); got != "nuxt-dev" {
		t.Errorf("got X-Test %q, want %q", got, "nuxt-dev")
	}
}

func TestDevServer_PreservesPath(t *testing.T) {
	t.Parallel()

	var gotPath string
	nuxt := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
	}))
	defer nuxt.Close()

	ds := NewDevServer(nuxt.URL, slog.Default())
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/_nuxt/app.js", nil)
	rr := httptest.NewRecorder()
	ds.ServeHTTP(rr, req)

	if gotPath != "/_nuxt/app.js" {
		t.Errorf("got path %q, want %q", gotPath, "/_nuxt/app.js")
	}
}

func TestDevServer_BackendDown(t *testing.T) {
	t.Parallel()

	// Point to a server that's not running
	ds := NewDevServer("http://127.0.0.1:1", slog.Default())
	if ds == nil {
		t.Fatal("expected non-nil DevServer")
	}

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()
	ds.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadGateway {
		t.Errorf("got status %d, want 502", rr.Code)
	}
}

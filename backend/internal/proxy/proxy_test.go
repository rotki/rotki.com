package proxy

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func testLogger() *slog.Logger {
	return slog.New(slog.DiscardHandler)
}

func TestNewReturnsNilWhenDomainEmpty(t *testing.T) {
	h := New(Config{Domain: ""}, testLogger())
	if h != nil {
		t.Fatal("expected nil handler when domain is empty")
	}
}

func TestNewReturnsHandlerWhenDomainSet(t *testing.T) {
	h := New(Config{Domain: "example.com"}, testLogger())
	if h == nil {
		t.Fatal("expected non-nil handler")
	}
}

func TestProxyForwardsWebapi(t *testing.T) {
	// Start a fake backend
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/webapi/2/plans" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		// Verify rewritten headers (Host is in r.Host, not r.Header)
		if r.Host == "" {
			t.Error("Host should be set")
		}
		if origin := r.Header.Get("Origin"); origin == "" {
			t.Error("Origin header should be set")
		}
		if referer := r.Header.Get("Referer"); referer == "" {
			t.Error("Referer header should be set")
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"plans":[]}`))
	}))
	defer backend.Close()

	// Extract host from backend URL (strip scheme)
	host := backend.Listener.Addr().String()

	h := New(Config{Domain: host, Insecure: true}, testLogger())
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/webapi/2/plans", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	body, _ := io.ReadAll(rec.Body)
	if string(body) != `{"plans":[]}` {
		t.Fatalf("body = %q, want plans JSON", string(body))
	}
}

func TestProxyForwardsMedia(t *testing.T) {
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/media/avatars/user.png" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "image/png")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("PNG"))
	}))
	defer backend.Close()

	host := backend.Listener.Addr().String()
	h := New(Config{Domain: host, Insecure: true}, testLogger())
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/media/avatars/user.png", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
}

func TestProxyReturns502OnBackendDown(t *testing.T) {
	// Point to a port that's not listening
	h := New(Config{Domain: "127.0.0.1:1", Insecure: true}, testLogger())
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/webapi/health", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want 502", rec.Code)
	}
}

func TestProxyPreservesQueryParams(t *testing.T) {
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.RawQuery != "page=1&limit=10" {
			t.Errorf("query = %q, want page=1&limit=10", r.URL.RawQuery)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer backend.Close()

	host := backend.Listener.Addr().String()
	h := New(Config{Domain: host, Insecure: true}, testLogger())
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/webapi/2/data?page=1&limit=10", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
}

func TestProxyForwardsPOST(t *testing.T) {
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("method = %s, want POST", r.Method)
		}
		body, _ := io.ReadAll(r.Body)
		if string(body) != `{"key":"value"}` {
			t.Errorf("body = %q", string(body))
		}
		w.WriteHeader(http.StatusCreated)
	}))
	defer backend.Close()

	host := backend.Listener.Addr().String()
	h := New(Config{Domain: host, Insecure: true}, testLogger())
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/webapi/2/action", strings.NewReader(`{"key":"value"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201", rec.Code)
	}
}

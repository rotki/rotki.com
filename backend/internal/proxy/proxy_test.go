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
	var gotHost, gotOrigin, gotReferer string
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/webapi/2/plans" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		// Host is in r.Host, not r.Header
		gotHost = r.Host
		gotOrigin = r.Header.Get("Origin")
		gotReferer = r.Header.Get("Referer")

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
	req.Host = "localhost:3000"
	req.Header.Set("Origin", "https://localhost:3000")
	req.Header.Set("Referer", "https://localhost:3000/checkout")
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	body, _ := io.ReadAll(rec.Body)
	if string(body) != `{"plans":[]}` {
		t.Fatalf("body = %q, want plans JSON", string(body))
	}

	wantOrigin := "http://" + host
	if gotHost != host {
		t.Errorf("Host = %q, want %q", gotHost, host)
	}
	if gotOrigin != wantOrigin {
		t.Errorf("Origin = %q, want %q", gotOrigin, wantOrigin)
	}
	if gotReferer != wantOrigin {
		t.Errorf("Referer = %q, want %q", gotReferer, wantOrigin)
	}
}

func TestProxyStripsHopByHopHeaders(t *testing.T) {
	var got http.Header
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = r.Header.Clone()
		w.WriteHeader(http.StatusOK)
	}))
	defer backend.Close()

	host := backend.Listener.Addr().String()
	h := New(Config{Domain: host, Insecure: true}, testLogger())
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/webapi/2/plans", nil)
	req.Header.Set("Connection", "X-Session-Hint")
	req.Header.Set("X-Session-Hint", "internal")
	req.Header.Set("Keep-Alive", "timeout=5")
	req.Header.Set("Proxy-Authorization", "Basic c2VjcmV0")
	req.Header.Set("Te", "trailers")
	req.Header.Set("X-Custom", "kept")
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	for _, name := range []string{"X-Session-Hint", "Keep-Alive", "Proxy-Authorization"} {
		if v := got.Get(name); v != "" {
			t.Errorf("%s = %q, want it stripped", name, v)
		}
	}
	if v := got.Get("Te"); v != "trailers" {
		t.Errorf("Te = %q, want %q", v, "trailers")
	}
	if v := got.Get("X-Custom"); v != "kept" {
		t.Errorf("X-Custom = %q, want %q", v, "kept")
	}
}

func TestProxyForwardedHeaders(t *testing.T) {
	tests := []struct {
		name      string
		inbound   map[string]string
		wantFor   string
		wantHost  string
		wantProto string
	}{
		{
			name: "keeps upstream proxy values and appends client IP",
			inbound: map[string]string{
				"X-Forwarded-For":   "198.51.100.1",
				"X-Forwarded-Host":  "rotki.com",
				"X-Forwarded-Proto": "https",
			},
			wantFor:   "198.51.100.1, 203.0.113.7",
			wantHost:  "rotki.com",
			wantProto: "https",
		},
		{
			name:    "sets client IP without inventing host or proto",
			inbound: map[string]string{},
			wantFor: "203.0.113.7",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var got http.Header
			backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				got = r.Header.Clone()
				w.WriteHeader(http.StatusOK)
			}))
			defer backend.Close()

			host := backend.Listener.Addr().String()
			h := New(Config{Domain: host, Insecure: true}, testLogger())
			mux := http.NewServeMux()
			h.RegisterRoutes(mux)

			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/webapi/2/plans", nil)
			req.RemoteAddr = "203.0.113.7:4321"
			for k, v := range tt.inbound {
				req.Header.Set(k, v)
			}
			rec := httptest.NewRecorder()
			mux.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, want 200", rec.Code)
			}
			if v := got.Get("X-Forwarded-For"); v != tt.wantFor {
				t.Errorf("X-Forwarded-For = %q, want %q", v, tt.wantFor)
			}
			if v := got.Get("X-Forwarded-Host"); v != tt.wantHost {
				t.Errorf("X-Forwarded-Host = %q, want %q", v, tt.wantHost)
			}
			if v := got.Get("X-Forwarded-Proto"); v != tt.wantProto {
				t.Errorf("X-Forwarded-Proto = %q, want %q", v, tt.wantProto)
			}
		})
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

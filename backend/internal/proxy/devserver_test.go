package proxy

import (
	"bufio"
	"context"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
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

func TestDevServer_RewritesHostAndKeepsForwardedHeaders(t *testing.T) {
	t.Parallel()

	var gotHost string
	var got http.Header
	nuxt := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotHost = r.Host
		got = r.Header.Clone()
		w.WriteHeader(http.StatusOK)
	}))
	defer nuxt.Close()

	ds := NewDevServer(nuxt.URL, slog.Default())
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/", nil)
	req.Host = "localhost:3000"
	req.RemoteAddr = "203.0.113.7:4321"
	req.Header.Set("X-Forwarded-Proto", "https")
	rr := httptest.NewRecorder()
	ds.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("got status %d, want 200", rr.Code)
	}
	if want := nuxt.Listener.Addr().String(); gotHost != want {
		t.Errorf("got Host %q, want %q", gotHost, want)
	}
	if v := got.Get("X-Forwarded-For"); v != "203.0.113.7" {
		t.Errorf("got X-Forwarded-For %q, want %q", v, "203.0.113.7")
	}
	if v := got.Get("X-Forwarded-Proto"); v != "https" {
		t.Errorf("got X-Forwarded-Proto %q, want %q", v, "https")
	}
}

// HMR runs over a WebSocket, so the upgrade has to survive the proxy.
func TestDevServer_ProxiesWebSocketUpgrade(t *testing.T) {
	t.Parallel()

	nuxt := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Upgrade") != "websocket" {
			http.Error(w, "expected upgrade", http.StatusBadRequest)
			return
		}
		hj, ok := w.(http.Hijacker)
		if !ok {
			t.Error("response writer does not support hijacking")
			return
		}
		conn, buf, err := hj.Hijack()
		if err != nil {
			t.Errorf("hijack: %v", err)
			return
		}
		defer func() { _ = conn.Close() }()
		_, _ = buf.WriteString("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n")
		_ = buf.Flush()
		// Echo one line back to prove the tunnel carries data both ways.
		line, err := buf.ReadString('\n')
		if err != nil {
			return
		}
		_, _ = buf.WriteString("echo: " + line)
		_ = buf.Flush()
	}))
	defer nuxt.Close()

	proxy := httptest.NewServer(NewDevServer(nuxt.URL, slog.Default()))
	defer proxy.Close()

	dialer := net.Dialer{Timeout: 5 * time.Second}
	conn, err := dialer.DialContext(context.Background(), "tcp", proxy.Listener.Addr().String())
	if err != nil {
		t.Fatalf("dial proxy: %v", err)
	}
	defer func() { _ = conn.Close() }()
	_ = conn.SetDeadline(time.Now().Add(5 * time.Second))

	_, err = io.WriteString(conn, "GET /_nuxt/ HTTP/1.1\r\nHost: localhost\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n")
	if err != nil {
		t.Fatalf("write upgrade request: %v", err)
	}

	reader := bufio.NewReader(conn)
	resp, err := http.ReadResponse(reader, nil)
	if err != nil {
		t.Fatalf("read upgrade response: %v", err)
	}
	// 1xx responses carry an empty body, so closing it leaves the tunnel open.
	_ = resp.Body.Close()
	if resp.StatusCode != http.StatusSwitchingProtocols {
		t.Fatalf("got status %d, want 101", resp.StatusCode)
	}

	if _, err = io.WriteString(conn, "ping\n"); err != nil {
		t.Fatalf("write through tunnel: %v", err)
	}
	line, err := reader.ReadString('\n')
	if err != nil {
		t.Fatalf("read through tunnel: %v", err)
	}
	if line != "echo: ping\n" {
		t.Errorf("got %q through tunnel, want %q", line, "echo: ping\n")
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

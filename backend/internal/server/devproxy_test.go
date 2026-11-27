package server

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/rotki/rotki.com/backend/internal/proxy"
)

// newEchoUpgradeServer stands in for the Vite HMR endpoint: it answers an
// Upgrade request with 101 and then echoes every line it reads.
func newEchoUpgradeServer(t *testing.T) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Upgrade") != "websocket" {
			http.Error(w, "upgrade required", http.StatusUpgradeRequired)
			return
		}
		conn, brw, err := http.NewResponseController(w).Hijack()
		if err != nil {
			t.Errorf("upstream hijack: %v", err)
			return
		}
		defer func() { _ = conn.Close() }()
		_, _ = brw.WriteString("HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n")
		_ = brw.Flush()
		for {
			line, err := brw.ReadString('\n')
			if err != nil {
				return
			}
			_, _ = brw.WriteString(line)
			_ = brw.Flush()
		}
	}))
	t.Cleanup(srv.Close)
	return srv
}

// syncBuffer is a bytes.Buffer safe to share between the server goroutines
// writing log lines and the test reading them.
type syncBuffer struct {
	mu  sync.Mutex
	buf bytes.Buffer
}

func (b *syncBuffer) Write(p []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.Write(p)
}

func (b *syncBuffer) String() string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.String()
}

// loggedStatuses returns the status of each "request" log line by path.
func loggedStatuses(t *testing.T, logs string) map[string]int {
	t.Helper()
	statuses := map[string]int{}
	for line := range strings.Lines(logs) {
		var entry struct {
			Msg    string `json:"msg"`
			Path   string `json:"path"`
			Status int    `json:"status"`
		}
		if err := json.Unmarshal([]byte(line), &entry); err != nil {
			t.Fatalf("parse log line %q: %v", line, err)
		}
		if entry.Msg == "request" {
			statuses[entry.Path] = entry.Status
		}
	}
	return statuses
}

func TestDevProxy_WebSocketUpgradeThroughMiddleware(t *testing.T) {
	upstream := newEchoUpgradeServer(t)
	var logs syncBuffer
	logger := slog.New(slog.NewJSONHandler(&logs, nil))

	dev := proxy.NewDevServer(upstream.URL, logger)
	if dev == nil {
		t.Fatal("NewDevServer returned nil")
	}
	mux := http.NewServeMux()
	mux.Handle("/", dev)

	front := httptest.NewUnstartedServer(withMiddleware(mux, true, logger))
	// Short timeouts check that the proxied socket outlives the server's
	// per-request deadlines.
	front.Config.ReadTimeout = 200 * time.Millisecond
	front.Config.WriteTimeout = 200 * time.Millisecond
	front.Start()
	t.Cleanup(front.Close)

	for _, path := range []string{"/_nuxt/?token=abc", "/"} {
		t.Run(path, func(t *testing.T) {
			req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, front.URL+path, nil)
			if err != nil {
				t.Fatal(err)
			}
			req.Header.Set("Connection", "Upgrade")
			req.Header.Set("Upgrade", "websocket")

			resp, err := front.Client().Do(req)
			if err != nil {
				t.Fatalf("request: %v", err)
			}
			defer func() { _ = resp.Body.Close() }()

			if resp.StatusCode != http.StatusSwitchingProtocols {
				body, _ := io.ReadAll(resp.Body)
				t.Fatalf("status = %d, want 101; body: %s", resp.StatusCode, body)
			}
			conn, ok := resp.Body.(io.ReadWriteCloser)
			if !ok {
				t.Fatalf("101 response body is %T, not io.ReadWriteCloser", resp.Body)
			}
			reader := bufio.NewReader(conn)

			for _, msg := range []string{"first\n", "after-timeout\n"} {
				if msg == "after-timeout\n" {
					time.Sleep(400 * time.Millisecond)
				}
				if _, err := io.WriteString(conn, msg); err != nil {
					t.Fatalf("write %q: %v", msg, err)
				}
				got, err := reader.ReadString('\n')
				if err != nil {
					t.Fatalf("read echo of %q: %v", msg, err)
				}
				if got != msg {
					t.Fatalf("echo = %q, want %q", got, msg)
				}
			}

			if h := resp.Header.Get("Content-Security-Policy"); strings.Contains(h, "nonce") {
				t.Errorf("upgrade response should not carry a nonce CSP, got %q", h)
			}
		})
	}

	// The request logger writes its line once the proxied socket closes, which
	// happens shortly after each subtest closes its end.
	want := map[string]int{"/_nuxt/": http.StatusSwitchingProtocols, "/": http.StatusSwitchingProtocols}
	deadline := time.Now().Add(2 * time.Second)
	for {
		got := loggedStatuses(t, logs.String())
		if got["/_nuxt/"] == want["/_nuxt/"] && got["/"] == want["/"] {
			return
		}
		if time.Now().After(deadline) {
			t.Fatalf("logged statuses = %v, want %v", got, want)
		}
		time.Sleep(10 * time.Millisecond)
	}
}

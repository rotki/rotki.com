package csp

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func newTestHandler() *Handler {
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	return NewHandler(logger)
}

const testOriginalPolicy = "default-src 'self'"

func makeReport(blockedURI, documentURI, violatedDirective string) string {
	report := map[string]any{
		"csp-report": map[string]any{
			"blocked-uri":        blockedURI,
			"document-uri":       documentURI,
			"violated-directive": violatedDirective,
			"original-policy":    testOriginalPolicy,
		},
	}
	b, _ := json.Marshal(report)
	return string(b)
}

func TestCSPHandler_ValidReport(t *testing.T) {
	h := newTestHandler()
	body := makeReport("https://evil.com/script.js", "https://rotki.com/", "script-src")
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/csp-report")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if !resp.Success {
		t.Fatal("expected success=true")
	}
}

func TestCSPHandler_MethodNotAllowed(t *testing.T) {
	h := newTestHandler()
	mux := http.NewServeMux()
	mux.Handle("POST /api/csp/violation", h)

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/csp/violation", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", w.Code)
	}
}

func TestCSPHandler_TooLarge(t *testing.T) {
	h := newTestHandler()
	// Create a body larger than 8KB
	large := bytes.Repeat([]byte("x"), maxReportSize+1)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", bytes.NewReader(large))
	req.ContentLength = int64(len(large))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("expected 413, got %d", w.Code)
	}
}

func TestCSPHandler_InvalidJSON(t *testing.T) {
	h := newTestHandler()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader("not json"))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCSPHandler_MissingRequiredFields(t *testing.T) {
	h := newTestHandler()
	body := `{"csp-report": {"blocked-uri": "https://evil.com"}}`
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCSPHandler_FiltersBrowserExtension(t *testing.T) {
	h := newTestHandler()
	body := makeReport("chrome-extension://abc123", "https://rotki.com/", "script-src")
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.Reason != "browser-extension" {
		t.Fatalf("expected reason=browser-extension, got %q", resp.Reason)
	}
}

func TestCSPHandler_FiltersSuspiciousPattern(t *testing.T) {
	h := newTestHandler()
	body := makeReport("https://evil.com/<script>alert(1)</script>", "https://rotki.com/", "script-src")
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.Reason != "suspicious-pattern" {
		t.Fatalf("expected reason=suspicious-pattern, got %q", resp.Reason)
	}
}

func TestCSPHandler_FiltersFalsePositive(t *testing.T) {
	h := newTestHandler()
	body := makeReport("https://rotki.com/favicon.ico", "https://rotki.com/", "img-src")
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.Reason != "false-positive" {
		t.Fatalf("expected reason=false-positive, got %q", resp.Reason)
	}
}

func TestCSPHandler_FiltersLocalhostDev(t *testing.T) {
	h := newTestHandler()
	body := makeReport("inline", "http://localhost:3000/", "script-src")
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.Reason != "localhost-development" {
		t.Fatalf("expected reason=localhost-development, got %q", resp.Reason)
	}
}

func TestCSPHandler_AcceptsUnknownFields(t *testing.T) {
	h := newTestHandler()
	// Simulate a browser sending extra fields not in our struct
	body := `{"csp-report": {
		"blocked-uri": "https://evil.com/script.js",
		"document-uri": "https://rotki.com/",
		"violated-directive": "script-src",
		"original-policy": "default-src 'self'",
		"disposition": "enforce",
		"document-url": "https://rotki.com/",
		"some-future-field": "value"
	}}`
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/csp-report")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if !resp.Success {
		t.Fatal("expected success=true")
	}
}

func TestCSPHandler_FiltersBotTraffic(t *testing.T) {
	h := newTestHandler()
	body := makeReport("https://evil.com/script.js", "https://rotki.com/", "script-src")
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/csp/violation", strings.NewReader(body))
	req.Header.Set("User-Agent", "Googlebot/2.1 (+http://www.google.com/bot.html)")
	w := httptest.NewRecorder()

	h.ServeHTTP(w, req)

	var resp cspResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.Reason != "bot-traffic" {
		t.Fatalf("expected reason=bot-traffic, got %q", resp.Reason)
	}
}

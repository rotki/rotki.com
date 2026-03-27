package webhooks

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/rotki/rotki.com/backend/internal/api/releases"
	"github.com/rotki/rotki.com/backend/internal/cache"
)

const testSecret = "test-webhook-secret" //nolint:gosec // test-only constant

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
}

func newTestHandler(t *testing.T) *Handler {
	t.Helper()
	logger := testLogger()
	mem := cache.NewMemory()
	t.Cleanup(mem.Close)
	red := cache.NewRedis("", "", logger)
	lck := cache.NewLock(red, logger)

	releasesHandler := releases.NewHandler(mem, red, lck, logger)

	// Pre-populate release cache so InvalidateCache's FetchFromGitHub doesn't hit the real API
	mem.Set("github:releases:latest", &releases.Release{
		TagName: "v1.35.0",
		Assets:  []releases.Asset{{Name: "test.exe", BrowserDownloadURL: "https://example.com/test.exe"}},
	}, time.Hour)

	return NewHandler(testSecret, releasesHandler, nil, logger)
}

func makeRequest(t *testing.T, body []byte, event string) *http.Request {
	t.Helper()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/webhooks/github", bytes.NewReader(body))
	req.Header.Set("X-Hub-Signature-256", computeSignature(body, testSecret))
	req.Header.Set("X-GitHub-Event", event)
	req.Header.Set("X-GitHub-Delivery", "test-delivery-id")
	return req
}

func releasePayload(t *testing.T, action, tagName string) []byte {
	t.Helper()
	payload := map[string]any{
		"action": action,
		"release": map[string]any{
			"tag_name": tagName,
		},
	}
	data, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}
	return data
}

func TestHandler_InvalidSignature(t *testing.T) {
	h := newTestHandler(t)

	body := releasePayload(t, "published", "v1.35.0")
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/webhooks/github", bytes.NewReader(body))
	req.Header.Set("X-Hub-Signature-256", "sha256=invalid")
	req.Header.Set("X-GitHub-Event", "release")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
}

func TestHandler_MissingSignature(t *testing.T) {
	h := newTestHandler(t)

	body := releasePayload(t, "published", "v1.35.0")
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/webhooks/github", bytes.NewReader(body))
	req.Header.Set("X-GitHub-Event", "release")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
}

func TestHandler_PingEvent(t *testing.T) {
	h := newTestHandler(t)

	body := []byte(`{"zen":"Keep it logically awesome."}`)
	req := makeRequest(t, body, "ping")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp webhookResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Status != "pong" {
		t.Errorf("expected status 'pong', got %q", resp.Status)
	}
}

func TestHandler_UnsupportedEvent(t *testing.T) {
	h := newTestHandler(t)

	body := []byte(`{}`)
	req := makeRequest(t, body, "push")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp webhookResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Status != "ignored" {
		t.Errorf("expected status 'ignored', got %q", resp.Status)
	}
}

func TestHandler_NonPublishedAction(t *testing.T) {
	h := newTestHandler(t)

	body := releasePayload(t, "edited", "v1.35.0")
	req := makeRequest(t, body, "release")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp webhookResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Status != "ignored" {
		t.Errorf("expected status 'ignored', got %q", resp.Status)
	}
}

func TestHandler_PublishedRelease(t *testing.T) {
	h := newTestHandler(t)

	body := releasePayload(t, "published", "v1.35.1")
	req := makeRequest(t, body, "release")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp webhookResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Status != "accepted" {
		t.Errorf("expected status 'accepted', got %q", resp.Status)
	}
	if resp.Tag != "v1.35.1" {
		t.Errorf("expected tag 'v1.35.1', got %q", resp.Tag)
	}
	if resp.ReleaseType != "patch" {
		t.Errorf("expected release_type 'patch', got %q", resp.ReleaseType)
	}
}

func TestHandler_RateLimit(t *testing.T) {
	h := newTestHandler(t)

	body := releasePayload(t, "published", "v1.35.0")

	// First request should succeed
	req := makeRequest(t, body, "release")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	var first webhookResponse
	_ = json.NewDecoder(w.Body).Decode(&first)
	if first.Status != "accepted" {
		t.Fatalf("first request: expected 'accepted', got %q", first.Status)
	}

	// Second request within rate limit window should be rate-limited
	req = makeRequest(t, body, "release")
	w = httptest.NewRecorder()
	h.ServeHTTP(w, req)

	var second webhookResponse
	_ = json.NewDecoder(w.Body).Decode(&second)
	if second.Status != "rate_limited" {
		t.Errorf("second request: expected 'rate_limited', got %q", second.Status)
	}
}

func TestHandler_BodyTooLarge(t *testing.T) {
	h := newTestHandler(t)

	// Create a body larger than maxBodySize (64 KB)
	largeBody := make([]byte, maxBodySize+100)
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/webhooks/github", bytes.NewReader(largeBody))
	req.Header.Set("X-Hub-Signature-256", computeSignature(largeBody, testSecret))
	req.Header.Set("X-GitHub-Event", "release")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("expected 413, got %d", w.Code)
	}
}

func TestHandler_InvalidJSON(t *testing.T) {
	h := newTestHandler(t)

	body := []byte(`{not json}`)
	req := makeRequest(t, body, "release")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestHandler_DeletedAction(t *testing.T) {
	h := newTestHandler(t)

	body := releasePayload(t, "deleted", "v1.35.0")
	req := makeRequest(t, body, "release")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	var resp webhookResponse
	_ = json.NewDecoder(w.Body).Decode(&resp)
	if resp.Status != "ignored" {
		t.Errorf("expected 'ignored' for deleted action, got %q", resp.Status)
	}
	if resp.Tag != "" {
		t.Errorf("expected empty tag for ignored action, got %q", resp.Tag)
	}
}

func TestHandler_AsyncInvalidation(t *testing.T) {
	h := newTestHandler(t)

	// Set up a channel to observe when the async invalidation completes
	done := make(chan struct{})
	h.onInvalidated = func() { close(done) }

	body := releasePayload(t, "published", "v1.36.0")
	req := makeRequest(t, body, "release")

	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)

	// Response should be immediate with "accepted"
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp webhookResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Status != "accepted" {
		t.Errorf("expected 'accepted', got %q", resp.Status)
	}
	if resp.ReleaseType != "minor_or_major" {
		t.Errorf("expected 'minor_or_major', got %q", resp.ReleaseType)
	}

	// Wait for async invalidation to complete (with timeout)
	select {
	case <-done:
		// Success — async goroutine completed
	case <-time.After(5 * time.Second):
		t.Fatal("async invalidation did not complete within timeout")
	}
}

func TestClassifyRelease(t *testing.T) {
	tests := []struct {
		tag  string
		want ReleaseType
	}{
		{"v1.35.0", ReleaseMinorOrMajor},
		{"v1.35.1", ReleasePatch},
		{"v1.35.2", ReleasePatch},
		{"v2.0.0", ReleaseMinorOrMajor},
		{"v1.0.0", ReleaseMinorOrMajor},
		{"v0.1.0", ReleaseMinorOrMajor},
		{"v0.1.1", ReleasePatch},
		// Without v prefix
		{"1.35.0", ReleaseMinorOrMajor},
		{"1.35.1", ReleasePatch},
		// Unparseable → defaults to MinorOrMajor (safe)
		{"invalid", ReleaseMinorOrMajor},
		{"v1.35", ReleaseMinorOrMajor},
		{"", ReleaseMinorOrMajor},
		{"v1.35.abc", ReleaseMinorOrMajor},
	}

	for _, tt := range tests {
		t.Run(tt.tag, func(t *testing.T) {
			got := ClassifyRelease(tt.tag)
			if got != tt.want {
				t.Errorf("ClassifyRelease(%q) = %v, want %v", tt.tag, got, tt.want)
			}
		})
	}
}

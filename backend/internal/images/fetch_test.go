package images

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/rotki/rotki.com/backend/internal/ipfs"
)

func testFetcher() *Fetcher {
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	return newFetcher(logger, nil, nil) // nil = default dialer, allows localhost in tests
}

func TestFetcher_FetchImage_IPFSGatewayFallback(t *testing.T) {
	limitedHits := 0
	limited := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		limitedHits++
		w.Header().Set("Retry-After", "2001")
		w.WriteHeader(http.StatusTooManyRequests)
	}))
	defer limited.Close()

	landing := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte("<html>gateway home</html>"))
	}))
	defer landing.Close()

	good := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/ipfs/bafybeiimage" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "image/png")
		_, _ = w.Write([]byte("png"))
	}))
	defer good.Close()

	logger := slog.New(slog.DiscardHandler)
	pool := ipfs.NewPool([]string{limited.URL + "/ipfs/", landing.URL + "/ipfs/", good.URL + "/ipfs/"}, logger)
	f := newFetcher(logger, nil, pool)

	for range 2 {
		data, headers, err := f.FetchImage(context.Background(), "ipfs://bafybeiimage")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if string(data) != "png" || headers.ContentType != "image/png" {
			t.Fatalf("unexpected response: %q %q", data, headers.ContentType)
		}
	}

	if limitedHits != 1 {
		t.Errorf("rate-limited gateway hit %d times, want 1 (cooldown should skip it)", limitedHits)
	}
}

func TestFetcher_FetchImage_IPFSUnsupportedTypeNotRetriedOnOtherGateways(t *testing.T) {
	first := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "image/avif")
		_, _ = w.Write([]byte("avif"))
	}))
	defer first.Close()

	secondHits := 0
	second := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		secondHits++
		w.Header().Set("Content-Type", "image/avif")
		_, _ = w.Write([]byte("avif"))
	}))
	defer second.Close()

	logger := slog.New(slog.DiscardHandler)
	pool := ipfs.NewPool([]string{first.URL + "/ipfs/", second.URL + "/ipfs/"}, logger)
	f := newFetcher(logger, nil, pool)

	// Returned as-is: the service decides it is unsupported (400) instead of every gateway being blamed
	_, headers, err := f.FetchImage(context.Background(), "ipfs://bafybeiimage")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if headers.ContentType != "image/avif" {
		t.Errorf("expected image/avif, got %q", headers.ContentType)
	}
	if secondHits != 0 {
		t.Errorf("second gateway should not be tried, got %d hits", secondHits)
	}
}

func TestFetcher_FetchImage_IPFSAllNotFound(t *testing.T) {
	missing := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer missing.Close()

	logger := slog.New(slog.DiscardHandler)
	pool := ipfs.NewPool([]string{missing.URL + "/ipfs/"}, logger)
	f := newFetcher(logger, nil, pool)

	_, _, err := f.FetchImage(context.Background(), "ipfs://bafybeiimage")
	fetchErr := &FetchError{}
	if !errors.As(err, &fetchErr) || fetchErr.StatusCode != http.StatusNotFound {
		t.Fatalf("expected wrapped 404 FetchError (so the service caches the 404), got %v", err)
	}
}

func TestFetcher_FetchImage_Success(t *testing.T) {
	imageData := strings.Repeat("x", 1024) // 1KB fake image
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Accept") != "image/*" {
			t.Error("expected Accept: image/* header")
		}
		if r.Header.Get("User-Agent") != "rotki.com/1.0" {
			t.Error("expected User-Agent: rotki.com/1.0 header")
		}
		w.Header().Set("Content-Type", "image/png")
		w.Header().Set("ETag", `"abc123"`)
		w.Header().Set("Last-Modified", "Mon, 01 Jan 2024 00:00:00 GMT")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(imageData))
	}))
	defer srv.Close()

	f := testFetcher()
	data, headers, err := f.FetchImage(context.Background(), srv.URL+"/image.png")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(data) != 1024 {
		t.Errorf("expected 1024 bytes, got %d", len(data))
	}
	if headers.ContentType != "image/png" {
		t.Errorf("expected image/png, got %s", headers.ContentType)
	}
	if headers.ETag != `"abc123"` {
		t.Errorf("expected etag \"abc123\", got %s", headers.ETag)
	}
	if headers.LastModified != "Mon, 01 Jan 2024 00:00:00 GMT" {
		t.Errorf("unexpected last-modified: %s", headers.LastModified)
	}
}

func TestFetcher_FetchImage_404(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("ETag", `"notfound"`)
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	f := testFetcher()
	_, _, err := f.FetchImage(context.Background(), srv.URL+"/missing.png")
	if err == nil {
		t.Fatal("expected error for 404")
	}

	fetchErr := &FetchError{}
	ok := errors.As(err, &fetchErr)
	if !ok {
		t.Fatalf("expected FetchError, got %T", err)
	}
	if fetchErr.StatusCode != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", fetchErr.StatusCode)
	}
	if fetchErr.ETag != `"notfound"` {
		t.Errorf("expected etag preserved on 404, got %s", fetchErr.ETag)
	}
}

func TestFetcher_FetchImage_TooLarge(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "image/png")
		w.WriteHeader(http.StatusOK)
		// Write more than MaxImageSize
		data := make([]byte, MaxImageSize+100)
		_, _ = w.Write(data)
	}))
	defer srv.Close()

	f := testFetcher()
	_, _, err := f.FetchImage(context.Background(), srv.URL+"/huge.png")
	if err == nil {
		t.Fatal("expected error for oversized image")
	}

	fetchErr := &FetchError{}
	ok := errors.As(err, &fetchErr)
	if !ok {
		t.Fatalf("expected FetchError, got %T", err)
	}
	if fetchErr.StatusCode != http.StatusRequestEntityTooLarge {
		t.Errorf("expected 413, got %d", fetchErr.StatusCode)
	}
}

func TestFetcher_FetchImage_ServerError_NoRetryOnClientError(t *testing.T) {
	attempts := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		attempts++
		w.WriteHeader(http.StatusForbidden) // 403 — client error, should not retry
	}))
	defer srv.Close()

	f := testFetcher()
	_, _, err := f.FetchImage(context.Background(), srv.URL+"/forbidden.png")
	if err == nil {
		t.Fatal("expected error")
	}
	if attempts != 1 {
		t.Errorf("expected 1 attempt for client error, got %d", attempts)
	}
}

func TestFetcher_FetchImage_ServerError_Retries(t *testing.T) {
	attempts := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		attempts++
		w.WriteHeader(http.StatusInternalServerError) // 500 — should retry
	}))
	defer srv.Close()

	f := testFetcher()
	_, _, err := f.FetchImage(context.Background(), srv.URL+"/error.png")
	if err == nil {
		t.Fatal("expected error after retries")
	}
	// maxRetries+1 total attempts
	if attempts != maxRetries+1 {
		t.Errorf("expected %d attempts, got %d", maxRetries+1, attempts)
	}
}

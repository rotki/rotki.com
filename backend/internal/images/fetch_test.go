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
)

func testFetcher() *Fetcher {
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	return newFetcher(logger, nil) // nil = default dialer, allows localhost in tests
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

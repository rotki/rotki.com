package images

import (
	"context"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/rotki/rotki.com/backend/internal/cache"
)

func testService(t *testing.T) (*Service, *httptest.Server) {
	t.Helper()
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	redis := cache.NewRedis("", "", logger)
	dir := t.TempDir()
	cm := NewCacheManager(dir, redis, logger)
	f := newFetcher(logger, nil)
	svc := NewService(cm, f, logger)

	// Create a test upstream server
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "missing") {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "image/png")
		w.Header().Set("ETag", `"test-etag"`)
		_, _ = w.Write([]byte("fake-png-data"))
	}))

	return svc, srv
}

func TestService_ServeImage_Success(t *testing.T) {
	svc, srv := testService(t)
	defer srv.Close()

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/nft/image?url="+srv.URL+"/test.png", nil)
	rec := httptest.NewRecorder()

	svc.ServeImage(context.Background(), rec, req, srv.URL+"/test.png")

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	if rec.Header().Get("Content-Type") != "image/png" {
		t.Errorf("expected image/png, got %s", rec.Header().Get("Content-Type"))
	}
	if rec.Header().Get("ETag") != `"test-etag"` {
		t.Errorf("expected ETag \"test-etag\", got %s", rec.Header().Get("ETag"))
	}
	if rec.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Error("expected X-Content-Type-Options: nosniff")
	}
	if !strings.Contains(rec.Header().Get("Cache-Control"), "public") {
		t.Error("expected Cache-Control to contain public")
	}
	if rec.Body.String() != "fake-png-data" {
		t.Errorf("unexpected body: %s", rec.Body.String())
	}
}

func TestService_ServeImage_404(t *testing.T) {
	svc, srv := testService(t)
	defer srv.Close()

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/nft/image?url="+srv.URL+"/missing.png", nil)
	rec := httptest.NewRecorder()

	svc.ServeImage(context.Background(), rec, req, srv.URL+"/missing.png")

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rec.Code)
	}
}

func TestService_ServeImage_InvalidContentType(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	redis := cache.NewRedis("", "", logger)
	dir := t.TempDir()
	cm := NewCacheManager(dir, redis, logger)
	f := newFetcher(logger, nil)
	svc := NewService(cm, f, logger)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("<html>not an image</html>"))
	}))
	defer srv.Close()

	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/nft/image?url="+srv.URL+"/page.html", nil)
	rec := httptest.NewRecorder()

	svc.ServeImage(context.Background(), rec, req, srv.URL+"/page.html")

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestService_FetchAndCache_Success(t *testing.T) {
	svc, srv := testService(t)
	defer srv.Close()

	err := svc.FetchAndCache(context.Background(), srv.URL+"/test.png")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestService_WarmCache(t *testing.T) {
	svc, srv := testService(t)
	defer srv.Close()

	urls := []string{
		srv.URL + "/img1.png",
		srv.URL + "/img2.png",
		srv.URL + "/missing.png",
	}

	succeeded, failed := svc.WarmCache(context.Background(), urls)

	if succeeded != 2 {
		t.Errorf("expected 2 succeeded, got %d", succeeded)
	}
	if failed != 1 {
		t.Errorf("expected 1 failed, got %d", failed)
	}
}

package images

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/rotki/rotki.com/backend/internal/cache"
	"github.com/rotki/rotki.com/backend/internal/ipfs"
	"github.com/rotki/rotki.com/backend/internal/nft"
)

func testService(t *testing.T) (*Service, *httptest.Server) {
	t.Helper()
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	redis := cache.NewRedis("", "", logger)
	dir := t.TempDir()
	cm := NewCacheManager(dir, redis, logger)
	f := newFetcher(logger, nil, nil)
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
	f := newFetcher(logger, nil, nil)
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

func TestService_WarmCache_UnsupportedTypeIsNotAFailure(t *testing.T) {
	logger := slog.New(slog.DiscardHandler)
	svc := NewService(NewCacheManager(t.TempDir(), cache.NewRedis("", "", logger), logger), newFetcher(logger, nil, nil), logger)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "image/avif")
		_, _ = w.Write([]byte("avif"))
	}))
	defer srv.Close()

	err := svc.FetchAndCache(context.Background(), srv.URL+"/tier.avif")
	if !errors.Is(err, ErrUnsupportedContentType) {
		t.Fatalf("expected ErrUnsupportedContentType, got %v", err)
	}

	succeeded, failed := svc.WarmCache(context.Background(), []string{srv.URL + "/tier.avif"})
	if succeeded != 0 || failed != 0 {
		t.Errorf("expected unsupported image to be neither succeeded nor failed, got %d/%d", succeeded, failed)
	}
}

// pngBytes starts with the PNG signature so content sniffing detects image/png.
var pngBytes = []byte("\x89PNG\r\n\x1a\n-fake-png-body")

func newTestService(t *testing.T, pool *ipfs.Pool) (*Service, *CacheManager) {
	t.Helper()
	logger := slog.New(slog.DiscardHandler)
	cm := NewCacheManager(t.TempDir(), cache.NewRedis("", "", logger), logger)
	return NewService(cm, newFetcher(logger, nil, pool), logger), cm
}

func serve(ctx context.Context, svc *Service, url string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	req := httptest.NewRequestWithContext(ctx, http.MethodGet, "/api/nft/image", nil)
	svc.ServeImage(ctx, rec, req, url)
	return rec
}

func waitFor(t *testing.T, what string, cond func() bool) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for !cond() {
		if time.Now().After(deadline) {
			t.Fatalf("timed out waiting for %s", what)
		}
		time.Sleep(5 * time.Millisecond)
	}
}

func inflightCount(svc *Service) int {
	svc.inflightMu.Lock()
	defer svc.inflightMu.Unlock()
	return len(svc.inflight)
}

func TestService_ServeImage_ClientDisconnectDoesNotCancelSharedFetch(t *testing.T) {
	release := make(chan struct{})
	var hits atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		hits.Add(1)
		<-release
		w.Header().Set("Content-Type", "image/png")
		_, _ = w.Write(pngBytes)
	}))
	defer srv.Close()

	svc, cm := newTestService(t, nil)
	url := srv.URL + "/avatar.png"

	ctxA, cancelA := context.WithCancel(context.Background())
	doneA := make(chan struct{})
	go func() {
		defer close(doneA)
		serve(ctxA, svc, url)
	}()
	waitFor(t, "shared fetch to start", func() bool { return inflightCount(svc) == 1 })

	doneB := make(chan *httptest.ResponseRecorder, 1)
	go func() { doneB <- serve(context.Background(), svc, url) }()
	time.Sleep(50 * time.Millisecond) // let B join the shared fetch

	cancelA()
	<-doneA
	close(release)

	recB := <-doneB
	if recB.Code != http.StatusOK {
		t.Fatalf("waiting request: expected 200 after the first client left, got %d: %s", recB.Code, recB.Body.String())
	}
	if recB.Body.String() != string(pngBytes) {
		t.Errorf("unexpected body: %q", recB.Body.String())
	}
	if got := hits.Load(); got != 1 {
		t.Errorf("expected 1 upstream fetch, got %d", got)
	}
	if _, ok := cm.DiskMetadata(url); !ok {
		t.Error("expected the image to be stored on disk")
	}
}

func TestService_ServeImage_SlowFetchReturns503AndStillCaches(t *testing.T) {
	release := make(chan struct{})
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		<-release
		w.Header().Set("Content-Type", "image/png")
		_, _ = w.Write(pngBytes)
	}))
	defer srv.Close()

	svc, cm := newTestService(t, nil)
	svc.requestWait = 50 * time.Millisecond
	url := srv.URL + "/slow.png"

	rec := serve(context.Background(), svc, url)
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 while the fetch is still running, got %d", rec.Code)
	}
	if got := rec.Header().Get("Retry-After"); got != "10" {
		t.Errorf("expected Retry-After 10, got %q", got)
	}
	if !strings.Contains(rec.Header().Get("Cache-Control"), "no-store") {
		t.Errorf("a pending response must not be cached, got %q", rec.Header().Get("Cache-Control"))
	}

	close(release)
	waitFor(t, "the detached fetch to cache the image", func() bool {
		_, ok := cm.DiskMetadata(url)
		return ok
	})
}

func TestService_ServeImage_RecoversIPFSImageFromDisk(t *testing.T) {
	var hits atomic.Int32
	gateway := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		hits.Add(1)
		w.WriteHeader(http.StatusBadGateway)
	}))
	defer gateway.Close()

	logger := slog.New(slog.DiscardHandler)
	svc, cm := newTestService(t, ipfs.NewPool([]string{gateway.URL + "/ipfs/"}, logger))
	raw := "ipfs://bafybeiimage"

	// With no-op Redis only the file remains, like metadata that expired or was cleared on a release
	cm.StoreImage(context.Background(), nft.NormalizeIPFSURL(raw), pngBytes, "image/png", "", "")

	rec := serve(context.Background(), svc, raw)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 from disk, got %d", rec.Code)
	}
	if rec.Header().Get("Content-Type") != "image/png" {
		t.Errorf("expected sniffed image/png, got %q", rec.Header().Get("Content-Type"))
	}
	if !strings.Contains(rec.Header().Get("Cache-Control"), "max-age=604800") {
		t.Errorf("content-addressed image should keep the normal cache lifetime, got %q", rec.Header().Get("Cache-Control"))
	}
	if got := hits.Load(); got != 0 {
		t.Errorf("expected no gateway requests, got %d", got)
	}
	if got := rec.Header().Get("ETag"); got != `"bafybeiimage"` {
		t.Errorf("recovered image should keep a CID ETag, got %q", got)
	}

	// Clients revalidating with the ETag get a 304 instead of the full image
	condRec := httptest.NewRecorder()
	condReq := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/nft/image", nil)
	condReq.Header.Set("If-None-Match", `"bafybeiimage"`)
	svc.ServeImage(context.Background(), condRec, condReq, raw)
	if condRec.Code != http.StatusNotModified {
		t.Errorf("expected 304 for a matching If-None-Match, got %d", condRec.Code)
	}
}

func TestIPFSETag(t *testing.T) {
	tests := []struct {
		url  string
		want string
	}{
		{"https://ipfs.io/ipfs/bafybeiimage", `"bafybeiimage"`},
		{"https://ipfs.io/ipfs/bafybeidir/art.png", `"bafybeidir/art.png"`},
		{"https://ipfs.io/ipfs/bafybeiimage?filename=x.png", `"bafybeiimage"`},
		{"https://ipfs.io/ipfs/", ""},
		{"https://metadata.ens.domains/mainnet/avatar/nick.eth", ""},
	}

	for _, tt := range tests {
		if got := ipfsETag(tt.url); got != tt.want {
			t.Errorf("ipfsETag(%q) = %q, want %q", tt.url, got, tt.want)
		}
	}
}

func TestService_FetchAndCache_RecoversIPFSImageFromDisk(t *testing.T) {
	var hits atomic.Int32
	gateway := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		hits.Add(1)
		w.WriteHeader(http.StatusBadGateway)
	}))
	defer gateway.Close()

	logger := slog.New(slog.DiscardHandler)
	svc, cm := newTestService(t, ipfs.NewPool([]string{gateway.URL + "/ipfs/"}, logger))
	raw := "ipfs://bafybeiimage"
	cm.StoreImage(context.Background(), nft.NormalizeIPFSURL(raw), pngBytes, "image/png", "", "")

	if err := svc.FetchAndCache(context.Background(), raw); err != nil {
		t.Fatalf("expected warm to succeed from disk, got %v", err)
	}
	if got := hits.Load(); got != 0 {
		t.Errorf("expected no gateway requests, got %d", got)
	}
}

func TestService_ServeImage_ServesStaleCopyWhenUpstreamFails(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusForbidden) // not retried, keeps the test fast
	}))
	defer srv.Close()

	svc, cm := newTestService(t, nil)
	url := srv.URL + "/avatar.png"
	cm.StoreImage(context.Background(), url, pngBytes, "image/png", "", "")

	rec := serve(context.Background(), svc, url)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected stale copy with 200, got %d", rec.Code)
	}
	if rec.Body.String() != string(pngBytes) {
		t.Errorf("unexpected body: %q", rec.Body.String())
	}
	if !strings.Contains(rec.Header().Get("Cache-Control"), "max-age=300") {
		t.Errorf("stale copy should use a short cache lifetime, got %q", rec.Header().Get("Cache-Control"))
	}
}

func TestService_ServeImage_NoStaleCopyForConfirmed404(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	svc, cm := newTestService(t, nil)
	url := srv.URL + "/removed.png"
	cm.StoreImage(context.Background(), url, pngBytes, "image/png", "", "")

	rec := serve(context.Background(), svc, url)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 to win over a stale copy, got %d", rec.Code)
	}
}

func TestService_ServeImage_StaleCopyInsteadOf503(t *testing.T) {
	release := make(chan struct{})
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		<-release
		w.Header().Set("Content-Type", "image/png")
		_, _ = w.Write(pngBytes)
	}))
	defer srv.Close()

	svc, cm := newTestService(t, nil)
	svc.requestWait = 50 * time.Millisecond
	url := srv.URL + "/avatar.png"
	cm.StoreImage(context.Background(), url, pngBytes, "image/png", "", "")

	rec := serve(context.Background(), svc, url)

	// Let the detached fetch finish before the test's temp cache dir is removed
	close(release)
	waitFor(t, "the detached fetch to finish", func() bool { return inflightCount(svc) == 0 })

	if rec.Code != http.StatusOK {
		t.Fatalf("expected the stale copy instead of 503, got %d", rec.Code)
	}
	if !strings.Contains(rec.Header().Get("Cache-Control"), "max-age=300") {
		t.Errorf("stale copy should use a short cache lifetime, got %q", rec.Header().Get("Cache-Control"))
	}
}

func TestService_SharedFetchTimeoutClearsInflightEntry(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		<-r.Context().Done() // hangs until the client gives up
	}))
	defer srv.Close()

	svc, _ := newTestService(t, nil)
	svc.sharedFetchTimeout = 50 * time.Millisecond
	svc.requestWait = 2 * time.Second

	rec := serve(context.Background(), svc, srv.URL+"/hung.png")
	if rec.Code != http.StatusBadGateway {
		t.Fatalf("expected 502 after the shared fetch timed out, got %d", rec.Code)
	}
	waitFor(t, "the timed-out fetch to leave the inflight map", func() bool { return inflightCount(svc) == 0 })
}

func TestService_ServeImage_UnsupportedTypeIsNotStoredOnDisk(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "image/avif")
		_, _ = w.Write([]byte("avif-bytes"))
	}))
	defer srv.Close()

	svc, cm := newTestService(t, nil)
	url := srv.URL + "/tier.avif"

	rec := serve(context.Background(), svc, url)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for unsupported type, got %d", rec.Code)
	}
	// Wait for the shared fetch to finish so a stray write would have happened
	waitFor(t, "the shared fetch to finish", func() bool { return inflightCount(svc) == 0 })
	f, err := cm.OpenImage(hashFilename(url))
	if f != nil {
		_ = f.Close()
		t.Error("unsupported image must not be written to disk, where it could be served as a stale copy")
	}
	if err != nil {
		t.Errorf("unexpected error opening cache file: %v", err)
	}
}

func TestService_ServeImage_NoStaleCopyForOversizedImage(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "image/png")
		_, _ = w.Write(make([]byte, MaxImageSize+100))
	}))
	defer srv.Close()

	svc, cm := newTestService(t, nil)
	url := srv.URL + "/huge.png"
	cm.StoreImage(context.Background(), url, pngBytes, "image/png", "", "")

	rec := serve(context.Background(), svc, url)
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("expected 413 to win over a stale copy, got %d", rec.Code)
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

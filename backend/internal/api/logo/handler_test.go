package logo

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/rotki/rotki.com/backend/internal/cache"
)

func testLogger() *slog.Logger {
	return slog.New(slog.DiscardHandler)
}

// fakeImages records the URL it was asked to serve instead of fetching it.
type fakeImages struct {
	url       string
	maxAge    time.Duration
	prefixTTL map[string]time.Duration
}

func (f *fakeImages) SetPrefixTTL(prefix string, ttl time.Duration) {
	if f.prefixTTL == nil {
		f.prefixTTL = map[string]time.Duration{}
	}
	f.prefixTTL[prefix] = ttl
}

func (f *fakeImages) ServeImageWithMaxAge(_ context.Context, w http.ResponseWriter, _ *http.Request, rawURL string, maxAge time.Duration) {
	f.url = rawURL
	f.maxAge = maxAge
	w.WriteHeader(http.StatusOK)
}

// dataRepo fakes rotki/data, answering asset-mappings.json with body and status, and counting requests.
func dataRepo(t *testing.T, status *atomic.Int32, body string) (*httptest.Server, *atomic.Int32) {
	t.Helper()
	var hits atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
		if r.URL.Path != "/main/constants/asset-mappings.json" {
			http.NotFound(w, r)
			return
		}
		w.WriteHeader(int(status.Load()))
		_, _ = io.WriteString(w, body)
	}))
	t.Cleanup(srv.Close)
	return srv, &hits
}

func newTestHandler(t *testing.T, baseURL string) (*Handler, *fakeImages) {
	t.Helper()
	memory := cache.NewMemory()
	t.Cleanup(memory.Close)
	redis := cache.NewRedis("", "", testLogger())
	images := &fakeImages{}
	h := NewHandler(memory, redis, cache.NewLock(redis, testLogger()), images, false, testLogger())
	h.baseURL = baseURL
	return h, images
}

func serve(h *Handler, name string) *httptest.ResponseRecorder {
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/logo/"+name, nil)
	req.SetPathValue("name", name)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestServesTheMappedImage(t *testing.T) {
	var status atomic.Int32
	status.Store(http.StatusOK)
	srv, _ := dataRepo(t, &status, `{"logo":{"website":"halloween.png","app":"app.png"}}`)
	h, images := newTestHandler(t, srv.URL)

	rec := serve(h, "website")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if want := srv.URL + "/main/assets/icons/halloween.png"; images.url != want {
		t.Errorf("served %q, want %q", images.url, want)
	}
	if images.maxAge != clientMaxAge {
		t.Errorf("maxAge = %v, want %v", images.maxAge, clientMaxAge)
	}
}

func TestShortensTheImageCacheForRotkiData(t *testing.T) {
	_, images := newTestHandler(t, "http://unused")
	if got := images.prefixTTL[dataRepoURL+"/"]; got != imageTTL {
		t.Errorf("rotki/data image TTL = %v, want %v", got, imageTTL)
	}
}

func TestReadsDevelopWhenTesting(t *testing.T) {
	memory := cache.NewMemory()
	t.Cleanup(memory.Close)
	redis := cache.NewRedis("", "", testLogger())
	h := NewHandler(memory, redis, cache.NewLock(redis, testLogger()), &fakeImages{}, true, testLogger())
	if h.branch != "develop" {
		t.Errorf("branch = %q, want develop", h.branch)
	}
}

func TestCachesTheMapping(t *testing.T) {
	var status atomic.Int32
	status.Store(http.StatusOK)
	srv, hits := dataRepo(t, &status, `{"logo":{"website":"app_logo.png"}}`)
	h, _ := newTestHandler(t, srv.URL)

	for range 3 {
		if rec := serve(h, "website"); rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
	}
	if got := hits.Load(); got != 1 {
		t.Errorf("rotki/data requests = %d, want 1", got)
	}
}

func TestFallsBackToTheLastMapping(t *testing.T) {
	var status atomic.Int32
	status.Store(http.StatusOK)
	srv, _ := dataRepo(t, &status, `{"logo":{"website":"app_logo.png"}}`)
	h, images := newTestHandler(t, srv.URL)

	if rec := serve(h, "website"); rec.Code != http.StatusOK {
		t.Fatalf("first status = %d, want 200", rec.Code)
	}

	// The fresh copy expires and rotki/data starts failing.
	h.memory.Delete(mappingCacheKey)
	status.Store(http.StatusInternalServerError)
	images.url = ""

	rec := serve(h, "website")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 from the stale mapping", rec.Code)
	}
	if want := srv.URL + "/main/assets/icons/app_logo.png"; images.url != want {
		t.Errorf("served %q, want %q", images.url, want)
	}
}

func TestUnavailableWithoutAnyMapping(t *testing.T) {
	var status atomic.Int32
	status.Store(http.StatusInternalServerError)
	srv, _ := dataRepo(t, &status, "")
	h, images := newTestHandler(t, srv.URL)

	rec := serve(h, "website")
	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("status = %d, want 503", rec.Code)
	}
	if images.url != "" {
		t.Errorf("served %q, want nothing", images.url)
	}
}

func TestRejectsUnknownNamesAndUnsafeFiles(t *testing.T) {
	var status atomic.Int32
	status.Store(http.StatusOK)
	srv, hits := dataRepo(t, &status, `{"logo":{"website":"../../secret.png","app":"app.png"}}`)
	h, images := newTestHandler(t, srv.URL)

	if rec := serve(h, "app"); rec.Code != http.StatusNotFound {
		t.Errorf("app: status = %d, want 404", rec.Code)
	}
	if hits.Load() != 0 {
		t.Error("an unknown name should not fetch the mapping")
	}

	if rec := serve(h, "website"); rec.Code != http.StatusNotFound {
		t.Errorf("path traversal: status = %d, want 404", rec.Code)
	}
	if images.url != "" {
		t.Errorf("served %q, want nothing", images.url)
	}
}

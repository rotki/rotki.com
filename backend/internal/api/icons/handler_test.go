package icons

import (
	"context"
	"net/http"
	"net/http/httptest"
	"slices"
	"sync"
	"testing"
	"time"

	"github.com/rotki/rotki.com/backend/internal/rotkidata"
)

// fakeImages records the URLs it was asked to serve instead of fetching them. When block
// is set, it holds each request until block is closed.
type fakeImages struct {
	mu      sync.Mutex
	urls    []string
	maxAge  time.Duration
	calls   int
	block   chan struct{}
	started chan struct{}
}

func (f *fakeImages) ServeFirstImage(_ context.Context, w http.ResponseWriter, _ *http.Request, urls []string, maxAge time.Duration) {
	f.mu.Lock()
	f.urls = urls
	f.maxAge = maxAge
	f.calls++
	f.mu.Unlock()
	if f.block != nil {
		f.started <- struct{}{}
		<-f.block
	}
	w.WriteHeader(http.StatusOK)
}

func serve(h *Handler, file string) *httptest.ResponseRecorder {
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/icons/x", nil)
	req.SetPathValue("file", file)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestServesMainThenDevelop(t *testing.T) {
	images := &fakeImages{}
	h := NewHandler(images, false)

	rec := serve(h, "usdc.png")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	want := []string{
		rotkidata.RepoURL + "/main/assets/icons/usdc.png",
		rotkidata.RepoURL + "/develop/assets/icons/usdc.png",
	}
	if !slices.Equal(images.urls, want) {
		t.Errorf("served %q, want %q", images.urls, want)
	}
	if images.maxAge != clientMaxAge {
		t.Errorf("maxAge = %v, want %v", images.maxAge, clientMaxAge)
	}
}

func TestReadsOnlyDevelopWhenTesting(t *testing.T) {
	images := &fakeImages{}
	h := NewHandler(images, true)

	serve(h, "eth.png")

	if want := []string{rotkidata.RepoURL + "/develop/assets/icons/eth.png"}; !slices.Equal(images.urls, want) {
		t.Errorf("served %q, want %q", images.urls, want)
	}
}

func TestRejectsNonIconPaths(t *testing.T) {
	for _, file := range []string{"", "eth.json", "../constants/asset-mappings.json", "icons/eth.png"} {
		t.Run(file, func(t *testing.T) {
			images := &fakeImages{}
			rec := serve(NewHandler(images, false), file)
			if rec.Code != http.StatusNotFound {
				t.Errorf("status = %d, want 404", rec.Code)
			}
			if images.calls != 0 {
				t.Errorf("image cache was asked for %q", images.urls)
			}
		})
	}
}

func TestCapsConcurrentRequests(t *testing.T) {
	images := &fakeImages{block: make(chan struct{}), started: make(chan struct{}, maxConcurrent)}
	h := NewHandler(images, false)

	done := make(chan struct{})
	for range maxConcurrent {
		go func() {
			serve(h, "eth.png")
			done <- struct{}{}
		}()
	}
	for range maxConcurrent {
		<-images.started
	}

	rec := serve(h, "dai.png")
	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("status = %d, want 503", rec.Code)
	}
	if rec.Header().Get("Retry-After") == "" {
		t.Error("missing Retry-After")
	}

	close(images.block)
	for range maxConcurrent {
		<-done
	}
	if rec := serve(h, "dai.png"); rec.Code != http.StatusOK {
		t.Errorf("after the others finished: status = %d, want 200", rec.Code)
	}
}

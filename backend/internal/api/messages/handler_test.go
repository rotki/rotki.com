package messages

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/rotki/rotki.com/backend/internal/cache"
)

// now is the fixed clock the tests run at.
var now = time.Unix(1_800_000_000, 0)

func testLogger() *slog.Logger {
	return slog.New(slog.DiscardHandler)
}

// dataRepo fakes rotki/data, answering dashboard.json with body and status, and counting requests.
func dataRepo(t *testing.T, status *atomic.Int32, body *atomic.Value) (*httptest.Server, *atomic.Int32) {
	t.Helper()
	var hits atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
		if r.URL.Path != "/main/messages/dashboard.json" {
			http.NotFound(w, r)
			return
		}
		w.WriteHeader(int(status.Load()))
		_, _ = io.WriteString(w, body.Load().(string))
	}))
	t.Cleanup(srv.Close)
	return srv, &hits
}

func newTestHandler(t *testing.T, baseURL string) *Handler {
	t.Helper()
	memory := cache.NewMemory()
	t.Cleanup(memory.Close)
	redis := cache.NewRedis("", "", testLogger())
	h := NewHandler(memory, redis, cache.NewLock(redis, testLogger()), false, testLogger())
	h.baseURL = baseURL
	h.now = func() time.Time { return now }
	return h
}

func serve(h *Handler) *httptest.ResponseRecorder {
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/messages/dashboard", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

// served decodes the response into the published objects.
func served(t *testing.T, rec *httptest.ResponseRecorder) []map[string]any {
	t.Helper()
	var got []map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("response is not a JSON array: %v (%q)", err, rec.Body.String())
	}
	return got
}

const (
	current = `{"message":"Current","message_highlight":"now","action":{"text":"Go","url":"https://example.com"},"period":{"start":1700000000,"end":1900000000}}`
	ended   = `{"message":"Ended","period":{"start":1600000000,"end":1700000000}}`
	planned = `{"message":"Planned","period":{"start":1850000000,"end":1900000000}}`
)

func fixture(status int32, body string) (*atomic.Int32, *atomic.Value) {
	var s atomic.Int32
	s.Store(status)
	var b atomic.Value
	b.Store(body)
	return &s, &b
}

func TestServesTheMessagesAsPublished(t *testing.T) {
	status, body := fixture(http.StatusOK, "["+current+"]")
	srv, _ := dataRepo(t, status, body)
	h := newTestHandler(t, srv.URL)

	rec := serve(h)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if got := rec.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", got)
	}
	if got := rec.Header().Get("Cache-Control"); got != "public, max-age=300" {
		t.Errorf("Cache-Control = %q, want public, max-age=300", got)
	}
	if got := rec.Body.String(); got != "["+current+"]" {
		t.Errorf("body = %s, want the published message untouched", got)
	}
}

func TestDropsEndedMessagesAndKeepsPlannedOnes(t *testing.T) {
	status, body := fixture(http.StatusOK, "["+ended+","+current+","+planned+"]")
	srv, _ := dataRepo(t, status, body)
	h := newTestHandler(t, srv.URL)

	got := served(t, serve(h))

	if len(got) != 2 || got[0]["message"] != "Current" || got[1]["message"] != "Planned" {
		t.Errorf("served %v, want Current and Planned", got)
	}
}

func TestServesAnEmptyArrayWhenNothingIsCurrent(t *testing.T) {
	status, body := fixture(http.StatusOK, "["+ended+"]")
	srv, _ := dataRepo(t, status, body)
	h := newTestHandler(t, srv.URL)

	rec := serve(h)

	if rec.Code != http.StatusOK || rec.Body.String() != "[]" {
		t.Errorf("got %d %q, want 200 []", rec.Code, rec.Body.String())
	}
}

func TestSkipsInvalidMessages(t *testing.T) {
	status, body := fixture(http.StatusOK, `[{"message":"","period":{"start":1,"end":1900000000}},{"message":"No period"},"text",`+current+`]`)
	srv, _ := dataRepo(t, status, body)
	h := newTestHandler(t, srv.URL)

	got := served(t, serve(h))

	if len(got) != 1 || got[0]["message"] != "Current" {
		t.Errorf("served %v, want only Current", got)
	}
}

func TestReadsDevelopWhenTesting(t *testing.T) {
	memory := cache.NewMemory()
	t.Cleanup(memory.Close)
	redis := cache.NewRedis("", "", testLogger())
	h := NewHandler(memory, redis, cache.NewLock(redis, testLogger()), true, testLogger())
	if h.branch != "develop" {
		t.Errorf("branch = %q, want develop", h.branch)
	}
}

func TestCachesTheMessages(t *testing.T) {
	status, body := fixture(http.StatusOK, "["+current+"]")
	srv, hits := dataRepo(t, status, body)
	h := newTestHandler(t, srv.URL)

	for range 3 {
		if rec := serve(h); rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
	}
	if got := hits.Load(); got != 1 {
		t.Errorf("rotki/data requests = %d, want 1", got)
	}
}

func TestFiltersEachRequestAgainstTheClock(t *testing.T) {
	status, body := fixture(http.StatusOK, "["+current+"]")
	srv, _ := dataRepo(t, status, body)
	h := newTestHandler(t, srv.URL)

	if got := served(t, serve(h)); len(got) != 1 {
		t.Fatalf("served %v, want Current", got)
	}

	// The message ends while its copy is still cached.
	h.now = func() time.Time { return time.Unix(1_900_000_000, 0) }
	if got := serve(h).Body.String(); got != "[]" {
		t.Errorf("body = %s, want [] once the message ended", got)
	}
}

func TestFallsBackToTheLastCopy(t *testing.T) {
	status, body := fixture(http.StatusOK, "["+current+"]")
	srv, _ := dataRepo(t, status, body)
	h := newTestHandler(t, srv.URL)

	if rec := serve(h); rec.Code != http.StatusOK {
		t.Fatalf("first status = %d, want 200", rec.Code)
	}

	// The fresh copy expires and rotki/data starts failing.
	h.memory.Delete(dashboardCacheKey)
	status.Store(http.StatusInternalServerError)

	got := served(t, serve(h))
	if len(got) != 1 || got[0]["message"] != "Current" {
		t.Errorf("served %v, want the stale Current", got)
	}
}

func TestKeepsTheLastCopyWhenTheFileIsBroken(t *testing.T) {
	status, body := fixture(http.StatusOK, "["+current+"]")
	srv, _ := dataRepo(t, status, body)
	h := newTestHandler(t, srv.URL)

	serve(h)
	h.memory.Delete(dashboardCacheKey)
	body.Store(`{"not":"an array"}`)

	got := served(t, serve(h))
	if len(got) != 1 || got[0]["message"] != "Current" {
		t.Errorf("served %v, want the stale Current", got)
	}
}

func TestUnavailableWithoutAnyCopy(t *testing.T) {
	status, body := fixture(http.StatusInternalServerError, "")
	srv, _ := dataRepo(t, status, body)
	h := newTestHandler(t, srv.URL)

	rec := serve(h)
	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("status = %d, want 503", rec.Code)
	}
	if got := rec.Header().Get("Cache-Control"); got != "no-store" {
		t.Errorf("Cache-Control = %q, want no-store", got)
	}
}

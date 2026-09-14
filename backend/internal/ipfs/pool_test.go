package ipfs

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func testLogger() *slog.Logger {
	return slog.New(slog.DiscardHandler)
}

// testGateway starts a gateway that answers every request with handler.
func testGateway(t *testing.T, handler http.HandlerFunc) (base string, hits *atomic.Int32) {
	t.Helper()
	hits = &atomic.Int32{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
		handler(w, r)
	}))
	t.Cleanup(srv.Close)
	return srv.URL + "/ipfs/", hits
}

// getAttempt fetches url and treats any non-200 as a StatusError.
func getAttempt(got *string) AttemptFunc {
	return func(ctx context.Context, url string) error {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return err
		}
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return err
		}
		defer func() { _ = resp.Body.Close() }()
		if resp.StatusCode != http.StatusOK {
			return &StatusError{StatusCode: resp.StatusCode, RetryAfter: resp.Header.Get("Retry-After")}
		}
		if resp.Header.Get("Content-Type") != "application/json" {
			return errors.New("unexpected content type")
		}
		*got = url
		return nil
	}
}

func ok(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(`{}`))
}

func TestParseRetryAfter(t *testing.T) {
	now := time.Date(2026, 9, 14, 10, 0, 0, 0, time.UTC)
	tests := []struct {
		name  string
		value string
		want  time.Duration
	}{
		{"seconds", "120", 2 * time.Minute},
		{"ipfs.io value clamped to max", "2001", 2001 * time.Second},
		{"above max", "86400", MaxRateLimitCooldown},
		{"below min", "1", MinRateLimitCooldown},
		{"http date", now.Add(10 * time.Minute).Format(http.TimeFormat), 10 * time.Minute},
		{"date in past", now.Add(-time.Minute).Format(http.TimeFormat), MinRateLimitCooldown},
		{"empty", "", DefaultRateLimitCooldown},
		{"garbage", "soon", DefaultRateLimitCooldown},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ParseRetryAfter(tt.value, now); got != tt.want {
				t.Errorf("ParseRetryAfter(%q) = %s, want %s", tt.value, got, tt.want)
			}
		})
	}
}

func TestParseGateways(t *testing.T) {
	got, err := ParseGateways(" https://a.example , https://b.example/ipfs/,https://c.example/ipfs ")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := []string{"https://a.example/ipfs/", "https://b.example/ipfs/", "https://c.example/ipfs/"}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}

	if got, err := ParseGateways(""); err != nil || got != nil {
		t.Errorf("empty value: got %v, %v; want nil, nil", got, err)
	}

	for _, bad := range []string{"http://insecure.example", "not a url", "ipfs://cid", ",,"} {
		if _, err := ParseGateways(bad); err == nil {
			t.Errorf("expected error for %q", bad)
		}
	}
}

func TestIsIPFS(t *testing.T) {
	p := NewPool([]string{"https://custom.example/ipfs/"}, testLogger())

	tests := []struct {
		url  string
		want bool
	}{
		{"ipfs://bafkrei123", true},
		{"ipfs://ipfs/bafkrei123", true},
		{"ipfs://bafybei456/image.png", true},
		{"https://ipfs.io/ipfs/bafkrei123", true},        // default gateway host
		{"https://custom.example/ipfs/bafkrei123", true}, // configured gateway host
		{"https://unknown.example/ipfs/bafkrei123", false},
		{"https://metadata.ens.domains/mainnet/avatar/vitalik.eth", false},
		{"ipfs://", false},
		{"https://ipfs.io/ipfs/", false},
	}

	for _, tt := range tests {
		if got := p.IsIPFS(tt.url); got != tt.want {
			t.Errorf("IsIPFS(%q) = %v, want %v", tt.url, got, tt.want)
		}
	}
}

func TestCandidates_SkipsCoolingGateways(t *testing.T) {
	p := NewPool([]string{"https://a/ipfs/", "https://b/ipfs/", "https://c/ipfs/"}, testLogger())
	now := time.Now()
	p.now = func() time.Time { return now }

	p.setCooldown("https://b/ipfs/", time.Minute)
	got := p.candidates("cid")
	if len(got) != 2 || got[0].gateway != "https://a/ipfs/" || got[1].gateway != "https://c/ipfs/" {
		t.Fatalf("expected a and c, got %+v", got)
	}

	// Cooldown expires
	now = now.Add(2 * time.Minute)
	if got := p.candidates("cid"); len(got) != 3 {
		t.Fatalf("expected all 3 after cooldown, got %+v", got)
	}
}

func TestCandidates_AllCoolingReturnsSoonest(t *testing.T) {
	p := NewPool([]string{"https://a/ipfs/", "https://b/ipfs/"}, testLogger())
	p.setCooldown("https://a/ipfs/", time.Hour)
	p.setCooldown("https://b/ipfs/", time.Minute)

	got := p.candidates("cid")
	if len(got) != 1 || got[0].url != "https://b/ipfs/cid" {
		t.Fatalf("expected only b, got %+v", got)
	}
}

func TestFetch_FallsBackOnRateLimitAndHonoursRetryAfter(t *testing.T) {
	limited, limitedHits := testGateway(t, func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Retry-After", "2001")
		w.WriteHeader(http.StatusTooManyRequests)
	})
	good, goodHits := testGateway(t, ok)

	p := NewPool([]string{limited, good}, testLogger())

	var served string
	if err := p.Fetch(context.Background(), "ipfs://bafkrei123", time.Second, getAttempt(&served)); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if served != good+"bafkrei123" {
		t.Errorf("served by %q, want fallback gateway", served)
	}

	// The rate-limited gateway is skipped on the next fetch
	if err := p.Fetch(context.Background(), "ipfs://bafkrei456", time.Second, getAttempt(&served)); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if limitedHits.Load() != 1 {
		t.Errorf("rate-limited gateway hit %d times, want 1", limitedHits.Load())
	}
	if goodHits.Load() != 2 {
		t.Errorf("fallback gateway hit %d times, want 2", goodHits.Load())
	}

	p.mu.Lock()
	remaining := time.Until(p.cooldowns[limited])
	p.mu.Unlock()
	if remaining < 2000*time.Second || remaining > 2001*time.Second {
		t.Errorf("cooldown %s does not follow Retry-After 2001", remaining)
	}
}

func TestFetch_SkipsHTMLLandingPage(t *testing.T) {
	landing, _ := testGateway(t, func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		_, _ = w.Write([]byte("<html>welcome</html>"))
	})
	good, _ := testGateway(t, ok)

	p := NewPool([]string{landing, good}, testLogger())
	var served string
	if err := p.Fetch(context.Background(), "ipfs://cid", time.Second, getAttempt(&served)); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if served != good+"cid" {
		t.Errorf("served by %q, want second gateway", served)
	}
}

func TestFetch_TimeoutMovesToNextGateway(t *testing.T) {
	slow, _ := testGateway(t, func(w http.ResponseWriter, r *http.Request) {
		select {
		case <-r.Context().Done():
		case <-time.After(2 * time.Second):
		}
		ok(w, r)
	})
	good, _ := testGateway(t, ok)

	p := NewPool([]string{slow, good}, testLogger())
	start := time.Now()
	var served string
	if err := p.Fetch(context.Background(), "ipfs://cid", 50*time.Millisecond, getAttempt(&served)); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if served != good+"cid" {
		t.Errorf("served by %q, want second gateway", served)
	}
	if elapsed := time.Since(start); elapsed > time.Second {
		t.Errorf("fetch took %s, per-gateway timeout not applied", elapsed)
	}
}

func TestFetch_AllNotFound(t *testing.T) {
	a, _ := testGateway(t, func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNotFound) })
	b, _ := testGateway(t, func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNotFound) })

	p := NewPool([]string{a, b}, testLogger())
	var served string
	err := p.Fetch(context.Background(), "ipfs://cid", time.Second, getAttempt(&served))

	var se *StatusError
	if !errors.As(err, &se) || se.StatusCode != http.StatusNotFound {
		t.Fatalf("expected wrapped 404, got %v", err)
	}
	// 404 is not a gateway fault
	if len(p.candidates("cid")) != 2 {
		t.Error("404 should not put gateways on cooldown")
	}
}

func TestFetch_NotFoundPlusFailureIsNotReportedAsNotFound(t *testing.T) {
	missing, _ := testGateway(t, func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNotFound) })
	broken, _ := testGateway(t, func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusBadGateway) })

	p := NewPool([]string{missing, broken}, testLogger())
	var served string
	err := p.Fetch(context.Background(), "ipfs://cid", time.Second, getAttempt(&served))

	var se *StatusError
	if !errors.As(err, &se) || se.StatusCode != http.StatusBadGateway {
		t.Fatalf("expected 502 as the reported error, got %v", err)
	}
}

func TestFetch_CallerCancellationStopsWithoutCooldown(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	a, _ := testGateway(t, func(_ http.ResponseWriter, r *http.Request) {
		cancel()
		<-r.Context().Done()
	})
	b, bHits := testGateway(t, ok)

	p := NewPool([]string{a, b}, testLogger())
	var served string
	err := p.Fetch(ctx, "ipfs://cid", 5*time.Second, getAttempt(&served))

	if !errors.Is(err, context.Canceled) {
		t.Fatalf("expected context.Canceled, got %v", err)
	}
	if bHits.Load() != 0 {
		t.Error("should not try more gateways after the caller cancelled")
	}
	if len(p.candidates("cid")) != 2 {
		t.Error("caller cancellation should not put the gateway on cooldown")
	}
}

func TestFetch_ContentProblemsStopWithoutCooldown(t *testing.T) {
	tests := []struct {
		name string
		err  error
	}{
		{"content rejected", fmt.Errorf("%w: unsupported type", ErrContentRejected)},
		{"413 too large", &StatusError{StatusCode: http.StatusRequestEntityTooLarge}},
		{"400 bad request", &StatusError{StatusCode: http.StatusBadRequest}},
		{"415 unsupported media", &StatusError{StatusCode: http.StatusUnsupportedMediaType}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := NewPool([]string{"https://a/ipfs/", "https://b/ipfs/"}, testLogger())
			calls := 0
			err := p.Fetch(context.Background(), "ipfs://cid", time.Second, func(context.Context, string) error {
				calls++
				return tt.err
			})

			if !errors.Is(err, tt.err) {
				t.Errorf("expected the attempt error back, got %v", err)
			}
			if calls != 1 {
				t.Errorf("expected 1 attempt, got %d", calls)
			}
			if len(p.candidates("cid")) != 2 {
				t.Error("content problems should not put gateways on cooldown")
			}
		})
	}
}

func TestFetch_ForbiddenIsGatewayFault(t *testing.T) {
	p := NewPool([]string{"https://a/ipfs/", "https://b/ipfs/"}, testLogger())
	calls := 0
	err := p.Fetch(context.Background(), "ipfs://cid", time.Second, func(_ context.Context, url string) error {
		calls++
		if strings.HasPrefix(url, "https://a/") {
			return &StatusError{StatusCode: http.StatusForbidden} // e.g. a Cloudflare challenge
		}
		return nil
	})
	if err != nil {
		t.Fatalf("expected fallback to succeed, got %v", err)
	}
	if calls != 2 {
		t.Errorf("expected 2 attempts, got %d", calls)
	}
}

func TestFetch_NotFoundWithGatewaysOnCooldownIsNotAConfirmedMiss(t *testing.T) {
	p := NewPool([]string{"https://a/ipfs/", "https://b/ipfs/", "https://c/ipfs/"}, testLogger())
	p.setCooldown("https://b/ipfs/", time.Hour)
	p.setCooldown("https://c/ipfs/", time.Hour)

	err := p.Fetch(context.Background(), "ipfs://cid", time.Second, func(context.Context, string) error {
		return &StatusError{StatusCode: http.StatusNotFound}
	})

	var se *StatusError
	if errors.As(err, &se) {
		t.Fatalf("404 must not be wrapped when gateways were skipped (it would be cached), got %v", err)
	}
	if err == nil || !strings.Contains(err.Error(), "on cooldown") {
		t.Fatalf("expected an on-cooldown not-found error, got %v", err)
	}
}

func TestIsHTML(t *testing.T) {
	tests := []struct {
		name        string
		contentType string
		body        string
		want        bool
	}{
		{"html content type", "text/html; charset=utf-8", "<html>", true},
		{"xhtml", "application/xhtml+xml", "", true},
		{"html body with octet-stream", "application/octet-stream", "  <!DOCTYPE html><html>", true},
		{"html body without content type", "", "<html><body>hi</body></html>", true},
		{"svg image", "image/svg+xml", "<svg xmlns='http://www.w3.org/2000/svg'/>", false},
		{"png image", "image/png", "\x89PNG", false},
		{"json", "application/json", `{"name":"x"}`, false},
		{"plain text", "text/plain", "not found", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsHTML(tt.contentType, []byte(tt.body)); got != tt.want {
				t.Errorf("IsHTML(%q, %q) = %v, want %v", tt.contentType, tt.body, got, tt.want)
			}
		})
	}
}

func TestFetch_RejectsNonIPFSURL(t *testing.T) {
	p := NewPool(nil, testLogger())
	err := p.Fetch(context.Background(), "https://example.com/a.png", time.Second, func(context.Context, string) error {
		t.Fatal("attempt should not be called")
		return nil
	})
	if err == nil || !strings.Contains(err.Error(), "not an IPFS URL") {
		t.Fatalf("expected not an IPFS URL error, got %v", err)
	}
}

func TestFetch_SuccessClearsCooldown(t *testing.T) {
	good, _ := testGateway(t, ok)
	p := NewPool([]string{good}, testLogger())
	p.setCooldown(good, time.Hour) // only gateway, so it is still tried as the soonest

	var served string
	if err := p.Fetch(context.Background(), "ipfs://cid", time.Second, getAttempt(&served)); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	p.mu.Lock()
	_, cooling := p.cooldowns[good]
	p.mu.Unlock()
	if cooling {
		t.Error("expected cooldown to be cleared after success")
	}
}

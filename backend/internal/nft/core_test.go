package nft

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/rotki/rotki.com/backend/internal/cache"
	"github.com/rotki/rotki.com/backend/internal/ipfs"
)

func TestWithoutTiers(t *testing.T) {
	tiers := map[int]*TierInfoResult{
		0: {MaxSupply: 10, ImageURL: "ipfs://image0"},
		1: {MaxSupply: 6, MetadataURI: "ipfs://meta1"}, // metadata fetch failed
		2: {MaxSupply: 0},                              // not configured for the release: no metadata, no image
		3: {MaxSupply: 2, MetadataURI: "ipfs://meta3"}, // metadata without an image field
	}

	got := withoutTiers(tiers, []int{1})

	if len(got) != 3 {
		t.Fatalf("expected 3 tiers, got %d: %v", len(got), got)
	}
	if _, ok := got[1]; ok {
		t.Error("expected failed tier 1 to be dropped")
	}
	for _, id := range []int{0, 2, 3} {
		if got[id] == nil {
			t.Errorf("expected tier %d to be kept (imageless tiers are still cached)", id)
		}
	}
}

func TestHasMetadata(t *testing.T) {
	if hasMetadata(&TierInfoResult{MetadataURI: "ipfs://meta"}) {
		t.Error("an entry with only a metadata URI (e.g. cached before a failed fetch) has no metadata")
	}
	for _, info := range []*TierInfoResult{{ImageURL: "ipfs://img"}, {Benefits: "Logo"}, {ReleaseName: "v1.45"}} {
		if !hasMetadata(info) {
			t.Errorf("expected %+v to count as fetched metadata", info)
		}
	}
}

func TestFetchMetadataHTTP_InvalidJSONStopsWithoutFallback(t *testing.T) {
	broken := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"name": truncated`))
	}))
	defer broken.Close()

	otherHits := 0
	other := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		otherHits++
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))
	defer other.Close()

	logger := slog.New(slog.DiscardHandler)
	pool := ipfs.NewPool([]string{broken.URL + "/ipfs/", other.URL + "/ipfs/"}, logger)
	s := &CoreService{gateways: pool, httpClient: http.DefaultClient, logger: logger}

	_, err := s.fetchMetadataHTTP(context.Background(), "ipfs://bafkreimeta")
	if !errors.Is(err, ipfs.ErrContentRejected) {
		t.Fatalf("expected ErrContentRejected, got %v", err)
	}
	if otherHits != 0 {
		t.Errorf("unparsable content should not be retried on other gateways, got %d hits", otherHits)
	}
}

func TestOnlyTiers(t *testing.T) {
	tiers := map[int]*TierInfoResult{
		0: {MaxSupply: 10},
		1: {MaxSupply: 6},
		2: {MaxSupply: 2},
	}

	got := onlyTiers(tiers, []int{1, 2, 7})

	if len(got) != 2 || got[1] == nil || got[2] == nil {
		t.Fatalf("expected tiers 1 and 2, got %v", got)
	}
	if _, ok := got[0]; ok {
		t.Error("expected tier 0 to be excluded")
	}
}

func TestIsPermanentMetadataError(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want bool
	}{
		{"recently confirmed missing", fmt.Errorf("%w: ipfs://x", ErrMetadataUnavailable), true},
		{"unusable content", fmt.Errorf("fetch metadata: %w", fmt.Errorf("%w: parse", ipfs.ErrContentRejected)), true},
		{"404 on every gateway", fmt.Errorf("not found on 3 gateways: %w", &ipfs.StatusError{StatusCode: http.StatusNotFound}), true},
		{"gateway 502", fmt.Errorf("all gateways failed: %w", &ipfs.StatusError{StatusCode: http.StatusBadGateway}), false},
		{"rate limited", &ipfs.StatusError{StatusCode: http.StatusTooManyRequests}, false},
		{"timeout", fmt.Errorf("gateway timed out: %w", context.DeadlineExceeded), false},
		{"404 with gateways on cooldown (not wrapped)", errors.New("ipfs content not found on 1 of 3 gateways (others on cooldown)"), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isPermanentMetadataError(tt.err); got != tt.want {
				t.Errorf("isPermanentMetadataError(%v) = %v, want %v", tt.err, got, tt.want)
			}
		})
	}
}

func TestFetchMetadata_CallerDisconnectDoesNotFailOtherWaiters(t *testing.T) {
	release := make(chan struct{})
	var hits atomic.Int32
	gateway := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		hits.Add(1)
		<-release
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"name":"Gold","image":"ipfs://bafybeigold"}`))
	}))
	defer gateway.Close()

	logger := slog.New(slog.DiscardHandler)
	s := &CoreService{
		cache:      NewCacheManager(cache.NewRedis("", "", logger), logger),
		gateways:   ipfs.NewPool([]string{gateway.URL + "/ipfs/"}, logger),
		httpClient: http.DefaultClient, // test servers are on loopback, which safedialer blocks
		inflight:   make(map[string]*inflightRequest),
		logger:     logger,
	}

	ctxA, cancelA := context.WithCancel(context.Background())
	errA := make(chan error, 1)
	go func() {
		_, err := s.FetchMetadata(ctxA, "ipfs://bafkreimeta")
		errA <- err
	}()

	deadline := time.Now().Add(3 * time.Second)
	for hits.Load() == 0 {
		if time.Now().After(deadline) {
			t.Fatal("timed out waiting for the shared fetch to reach the gateway")
		}
		time.Sleep(5 * time.Millisecond)
	}

	type result struct {
		metadata *TierMetadata
		err      error
	}
	resB := make(chan result, 1)
	go func() {
		metadata, err := s.FetchMetadata(context.Background(), "ipfs://bafkreimeta")
		resB <- result{metadata, err}
	}()
	time.Sleep(50 * time.Millisecond) // let B join the shared fetch

	cancelA()
	if err := <-errA; !errors.Is(err, context.Canceled) {
		t.Fatalf("disconnected caller: expected context.Canceled, got %v", err)
	}
	close(release)

	b := <-resB
	if b.err != nil {
		t.Fatalf("waiting caller failed after the first caller disconnected: %v", b.err)
	}
	if b.metadata == nil || b.metadata.Image != "ipfs://bafybeigold" {
		t.Errorf("unexpected metadata: %+v", b.metadata)
	}
	if got := hits.Load(); got != 1 {
		t.Errorf("expected 1 gateway request, got %d", got)
	}
}

func TestFetchMetadataHTTP_FallsBackAcrossGateways(t *testing.T) {
	limited := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Retry-After", "2001")
		w.WriteHeader(http.StatusTooManyRequests)
	}))
	defer limited.Close()

	landing := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		_, _ = w.Write([]byte("<html>gateway home</html>"))
	}))
	defer landing.Close()

	good := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasSuffix(r.URL.Path, "/ipfs/bafkreimeta") {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"name":"Silver","image":"ipfs://bafybeiimage","attributes":[{"trait_type":"Benefits","value":"Logo"}]}`))
	}))
	defer good.Close()

	logger := slog.New(slog.DiscardHandler)
	s := &CoreService{
		gateways:   ipfs.NewPool([]string{limited.URL + "/ipfs/", landing.URL + "/ipfs/", good.URL + "/ipfs/"}, logger),
		httpClient: http.DefaultClient, // test servers are on loopback, which safedialer blocks
		logger:     logger,
	}

	metadata, err := s.fetchMetadataHTTP(context.Background(), "ipfs://bafkreimeta")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if metadata.Image != "ipfs://bafybeiimage" {
		t.Errorf("expected image from fallback gateway, got %q", metadata.Image)
	}
}

func TestFetchMetadataHTTP_AllGatewaysFail(t *testing.T) {
	broken := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
	}))
	defer broken.Close()

	logger := slog.New(slog.DiscardHandler)
	s := &CoreService{
		gateways:   ipfs.NewPool([]string{broken.URL + "/ipfs/"}, logger),
		httpClient: http.DefaultClient,
		logger:     logger,
	}

	_, err := s.fetchMetadataHTTP(context.Background(), "ipfs://bafkreimeta")
	if err == nil || !strings.Contains(err.Error(), "502") {
		t.Fatalf("expected error mentioning 502, got %v", err)
	}
}

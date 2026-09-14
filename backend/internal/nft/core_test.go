package nft

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

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

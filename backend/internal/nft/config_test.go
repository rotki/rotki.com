package nft

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestConfigServiceFetch_SepoliaChain(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/webapi/nfts/release/current/" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		if accept := r.Header.Get("Accept"); accept != "application/json" {
			t.Errorf("expected Accept: application/json, got %q", accept)
		}
		resp := map[string]any{
			"chain":            "sepolia",
			"contract_address": "0x9C4Ac51128b3B29c8c4C76c960a07c17b8290557",
			"release_id":       2,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	svc := NewConfigService(srv.URL, false, slog.Default())
	cfg, err := svc.Fetch(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.ChainID != 11155111 {
		t.Errorf("expected sepolia chain ID 11155111, got %d", cfg.ChainID)
	}
	if cfg.ContractAddress != "0x9C4Ac51128b3B29c8c4C76c960a07c17b8290557" {
		t.Errorf("unexpected contract address: %s", cfg.ContractAddress)
	}
	if cfg.ReleaseID != 2 {
		t.Errorf("expected release ID 2, got %d", cfg.ReleaseID)
	}
	if len(cfg.RPCURLs) == 0 {
		t.Fatal("expected RPCURLs to be populated from sepolia chain config")
	}
	// Verify URLs match the sepolia config
	sepoliaCfg := ChainConfigs["sepolia"]
	if len(cfg.RPCURLs) != len(sepoliaCfg.RPCURLs) {
		t.Errorf("expected %d RPC URLs, got %d", len(sepoliaCfg.RPCURLs), len(cfg.RPCURLs))
	}
	for i, url := range cfg.RPCURLs {
		if url != sepoliaCfg.RPCURLs[i] {
			t.Errorf("RPC URL[%d] = %s, want %s", i, url, sepoliaCfg.RPCURLs[i])
		}
	}
}

func TestConfigServiceFetch_EthereumChain(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		resp := map[string]any{
			"chain":            "ethereum",
			"contract_address": "0x1234567890abcdef1234567890abcdef12345678",
			"release_id":       1,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	svc := NewConfigService(srv.URL, false, slog.Default())
	cfg, err := svc.Fetch(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.ChainID != 1 {
		t.Errorf("expected ethereum chain ID 1, got %d", cfg.ChainID)
	}
	if len(cfg.RPCURLs) == 0 {
		t.Fatal("expected RPCURLs to be populated from ethereum chain config")
	}
	ethCfg := ChainConfigs["ethereum"]
	if len(cfg.RPCURLs) != len(ethCfg.RPCURLs) {
		t.Errorf("expected %d RPC URLs, got %d", len(ethCfg.RPCURLs), len(cfg.RPCURLs))
	}
}

func TestConfigServiceFetch_UnsupportedChain(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		resp := map[string]any{
			"chain":            "polygon",
			"contract_address": "0x1234",
			"release_id":       1,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	svc := NewConfigService(srv.URL, false, slog.Default())
	_, err := svc.Fetch(context.Background())
	if err == nil {
		t.Fatal("expected error for unsupported chain")
	}
}

func TestConfigServiceFetch_DetectsContractChange(t *testing.T) {
	callCount := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		callCount++
		addr := "0xAAAA"
		if callCount > 1 {
			addr = "0xBBBB"
		}
		resp := map[string]any{
			"chain":            "ethereum",
			"contract_address": addr,
			"release_id":       1,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	svc := NewConfigService(srv.URL, false, slog.Default())
	ctx := context.Background()

	cfg1, err := svc.Fetch(ctx)
	if err != nil {
		t.Fatalf("first fetch: %v", err)
	}
	if cfg1.HasContractChanged {
		t.Error("first fetch should not report contract changed")
	}

	cfg2, err := svc.Fetch(ctx)
	if err != nil {
		t.Fatalf("second fetch: %v", err)
	}
	if !cfg2.HasContractChanged {
		t.Error("second fetch should report contract changed")
	}
}

package nft

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
)

func TestBlockchainService_UpdateRPCURLs(t *testing.T) {
	rpcClient := newTestRPCClient([]string{"http://old.example.com"})
	svc := NewBlockchainService(rpcClient, slog.Default())

	newURLs := []string{"http://new1.example.com", "http://new2.example.com"}
	svc.UpdateRPCURLs(newURLs)

	rpcClient.mu.RLock()
	defer rpcClient.mu.RUnlock()
	if len(rpcClient.urls) != 2 {
		t.Fatalf("expected 2 URLs, got %d", len(rpcClient.urls))
	}
	if rpcClient.urls[0] != "http://new1.example.com" {
		t.Errorf("expected new1, got %s", rpcClient.urls[0])
	}
}

// rpcHandler returns an HTTP handler that dispatches based on the eth_call "to" address.
// multicallResult is returned for calls to Multicall3Address.
// directResult is returned for calls to any other address.
func rpcHandler(t *testing.T, multicallResult, directResult string) http.HandlerFunc {
	t.Helper()
	return func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		_ = r.Body.Close()

		// Extract the "to" field from the JSON-RPC params
		var req struct {
			Params []json.RawMessage `json:"params"`
		}
		_ = json.Unmarshal(body, &req)

		hexResult := directResult
		if len(req.Params) > 0 {
			var callObj map[string]string
			_ = json.Unmarshal(req.Params[0], &callObj)
			if strings.EqualFold(callObj["to"], Multicall3Address) {
				hexResult = multicallResult
			}
		}

		resp := rpcResponse{JSONRPC: "2.0", ID: 1}
		resp.Result, _ = json.Marshal(hexResult)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}
}

// mockRPCServer creates an httptest.Server that responds to all eth_calls with the given hex data.
func mockRPCServer(t *testing.T, hexResult string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		resp := rpcResponse{JSONRPC: "2.0", ID: 1}
		resp.Result, _ = json.Marshal(hexResult)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
}

func TestFetchTierInfo_AfterURLSwitch(t *testing.T) {
	// Server that returns empty for everything (simulates wrong chain)
	emptySrv := mockRPCServer(t, "0x")
	defer emptySrv.Close()

	// Server that returns empty for multicall (let it fall back) but valid tier info for direct calls
	metadataURI := "ipfs://test"
	validHex := buildTierInfoHex(100, 5, metadataURI)
	validSrv := httptest.NewServer(rpcHandler(t, "0x", validHex))
	defer validSrv.Close()

	// Start with the empty (wrong-chain) server
	rpcClient := newTestRPCClient([]string{emptySrv.URL})
	blockchainSvc := NewBlockchainService(rpcClient, slog.Default())

	cfg := &Config{
		ContractAddress: "0x9C4Ac51128b3B29c8c4C76c960a07c17b8290557",
	}

	// Should fail — empty results from wrong chain
	info, err := blockchainSvc.FetchTierInfo(context.Background(), cfg, 2, 0)
	if err == nil && info != nil {
		t.Fatal("expected failure or nil info from wrong-chain server")
	}

	// Switch to the correct chain's RPC
	blockchainSvc.UpdateRPCURLs([]string{validSrv.URL})

	// Should succeed now — multicall returns empty, falls back to direct call which works
	info, err = blockchainSvc.FetchTierInfo(context.Background(), cfg, 2, 0)
	if err != nil {
		t.Fatalf("expected success after URL switch, got: %v", err)
	}
	if info == nil {
		t.Fatal("expected non-nil tier info")
	}
	if info.MaxSupply != 100 {
		t.Errorf("expected maxSupply=100, got %d", info.MaxSupply)
	}
	if info.CurrentSupply != 5 {
		t.Errorf("expected currentSupply=5, got %d", info.CurrentSupply)
	}
	if info.MetadataURI != metadataURI {
		t.Errorf("expected metadataURI=%q, got %q", metadataURI, info.MetadataURI)
	}
}

func TestGetCurrentReleaseID_Success(t *testing.T) {
	// Return uint256(2) — direct call returns 32 bytes, multicall returns empty
	hexResult := fmt.Sprintf("0x%064x", 2)
	srv := httptest.NewServer(rpcHandler(t, "0x", hexResult))
	defer srv.Close()

	rpcClient := newTestRPCClient([]string{srv.URL})
	blockchainSvc := NewBlockchainService(rpcClient, slog.Default())

	cfg := &Config{ContractAddress: "0x1234"}
	releaseID, err := blockchainSvc.GetCurrentReleaseID(context.Background(), cfg)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if releaseID != 2 {
		t.Errorf("expected release ID 2, got %d", releaseID)
	}
}

func TestGetCurrentReleaseID_EmptyResponse(t *testing.T) {
	srv := mockRPCServer(t, "0x")
	defer srv.Close()

	rpcClient := newTestRPCClient([]string{srv.URL})
	blockchainSvc := NewBlockchainService(rpcClient, slog.Default())

	cfg := &Config{ContractAddress: "0x1234"}
	_, err := blockchainSvc.GetCurrentReleaseID(context.Background(), cfg)
	if err == nil {
		t.Fatal("expected error for empty response")
	}
}

func TestFetchMultipleTierInfo_AllEmpty_FallsBack(t *testing.T) {
	var callCount atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		callCount.Add(1)
		resp := rpcResponse{JSONRPC: "2.0", ID: 1}
		resp.Result, _ = json.Marshal("0x")
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	rpcClient := newTestRPCClient([]string{srv.URL})
	blockchainSvc := NewBlockchainService(rpcClient, slog.Default())

	cfg := &Config{ContractAddress: "0x1234"}
	result, err := blockchainSvc.FetchMultipleTierInfo(context.Background(), cfg, 2, []int{0, 1, 2})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should have entries for all tiers (nil values since server returns empty)
	if len(result) != 3 {
		t.Errorf("expected 3 entries, got %d", len(result))
	}
	for _, tierID := range []int{0, 1, 2} {
		if result[tierID] != nil {
			t.Errorf("expected nil for tier %d, got %+v", tierID, result[tierID])
		}
	}

	// At least: 1 batch multicall (empty) + 3 individual tiers × (1 multicall + 1 direct) = 7
	if callCount.Load() < 4 {
		t.Errorf("expected at least 4 RPC calls, got %d", callCount.Load())
	}
}

func TestFetchTierInfo_DirectCallSuccess(t *testing.T) {
	// Multicall returns empty, direct call returns valid data
	metadataURI := "ipfs://bronze"
	validHex := buildTierInfoHex(100, 5, metadataURI)
	srv := httptest.NewServer(rpcHandler(t, "0x", validHex))
	defer srv.Close()

	rpcClient := newTestRPCClient([]string{srv.URL})
	blockchainSvc := NewBlockchainService(rpcClient, slog.Default())

	cfg := &Config{ContractAddress: "0x1234"}
	info, err := blockchainSvc.FetchTierInfo(context.Background(), cfg, 2, 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if info == nil {
		t.Fatal("expected non-nil tier info")
	}
	if info.MaxSupply != 100 {
		t.Errorf("expected maxSupply=100, got %d", info.MaxSupply)
	}
	if info.CurrentSupply != 5 {
		t.Errorf("expected currentSupply=5, got %d", info.CurrentSupply)
	}
	if info.MetadataURI != metadataURI {
		t.Errorf("expected metadataURI=%q, got %q", metadataURI, info.MetadataURI)
	}
}

// buildTierInfoHex builds an ABI-encoded getTierInfo response.
// getTierInfo returns (uint256 maxSupply, uint256 currentSupply, string metadataURI)
func buildTierInfoHex(maxSupply, currentSupply int, metadataURI string) string {
	data := make([]byte, 0, 256)
	data = append(data, encodeUint256(maxSupply)...)
	data = append(data, encodeUint256(currentSupply)...)
	// String offset: points to byte 96 (3 * 32)
	data = append(data, encodeUint256(96)...)
	// String length
	data = append(data, encodeUint256(len(metadataURI))...)
	// String data (padded to 32 bytes)
	strBytes := []byte(metadataURI)
	padded := make([]byte, ((len(strBytes)+31)/32)*32)
	copy(padded, strBytes)
	data = append(data, padded...)

	return "0x" + fmt.Sprintf("%x", data)
}

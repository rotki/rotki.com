package nft

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// newTestRPCClient creates an RPCClient that uses the default HTTP transport
// (no safedialer) so it can connect to httptest.Server on localhost.
func newTestRPCClient(urls []string) *RPCClient {
	return &RPCClient{
		urls: urls,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
		logger:   slog.Default(),
		failures: make(map[string]time.Time),
	}
}

func TestUpdateURLs_ReplacesURLsAndResetsFailures(t *testing.T) {
	client := newTestRPCClient([]string{"http://old1.example.com", "http://old2.example.com"})

	// Mark a URL as failed
	client.markFailed("http://old1.example.com")
	if client.isAvailable("http://old1.example.com") {
		t.Fatal("expected old1 to be unavailable after marking failed")
	}

	// Update URLs
	newURLs := []string{"http://new1.example.com", "http://new2.example.com"}
	client.UpdateURLs(newURLs)

	// Verify URLs were replaced
	client.mu.RLock()
	defer client.mu.RUnlock()
	if len(client.urls) != 2 {
		t.Fatalf("expected 2 URLs, got %d", len(client.urls))
	}
	if client.urls[0] != "http://new1.example.com" {
		t.Errorf("expected new1, got %s", client.urls[0])
	}
	if client.urls[1] != "http://new2.example.com" {
		t.Errorf("expected new2, got %s", client.urls[1])
	}

	// Verify failures were reset
	if len(client.failures) != 0 {
		t.Errorf("expected failures to be empty, got %d entries", len(client.failures))
	}
}

func TestUpdateURLs_EmptySlice(t *testing.T) {
	client := newTestRPCClient([]string{"http://old.example.com"})

	client.UpdateURLs([]string{})

	client.mu.RLock()
	defer client.mu.RUnlock()
	if len(client.urls) != 0 {
		t.Errorf("expected 0 URLs, got %d", len(client.urls))
	}
}

func TestEthCall_UsesUpdatedURLs(t *testing.T) {
	// Start a mock RPC server that returns a valid response
	callCount := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		callCount++
		val := fmt.Sprintf("0x%064x", 42)
		resp := rpcResponse{JSONRPC: "2.0", ID: 1}
		resp.Result, _ = json.Marshal(val)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	// Start with a bad URL (port 1 — nothing listens there)
	client := newTestRPCClient([]string{"http://127.0.0.1:1"})

	// This should fail since the URL is unreachable
	_, err := client.EthCall(context.Background(), "0x1234", []byte{0x01})
	if err == nil {
		t.Fatal("expected error with bad URL")
	}

	// Update to the working mock server
	client.UpdateURLs([]string{srv.URL})

	// Now it should succeed
	result, err := client.EthCall(context.Background(), "0x1234", []byte{0x01})
	if err != nil {
		t.Fatalf("expected success after URL update, got: %v", err)
	}
	if result == nil {
		t.Fatal("expected non-nil result")
	}
	if callCount != 1 {
		t.Errorf("expected 1 call to mock server, got %d", callCount)
	}
}

func TestEthCall_FallbackOnFailure(t *testing.T) {
	// First server always fails
	failSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer failSrv.Close()

	// Second server succeeds
	okSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		val := fmt.Sprintf("0x%064x", 1)
		resp := rpcResponse{JSONRPC: "2.0", ID: 1}
		resp.Result, _ = json.Marshal(val)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer okSrv.Close()

	client := newTestRPCClient([]string{failSrv.URL, okSrv.URL})

	result, err := client.EthCall(context.Background(), "0x1234", []byte{0x01})
	if err != nil {
		t.Fatalf("expected fallback to succeed, got: %v", err)
	}
	if result == nil {
		t.Fatal("expected non-nil result from fallback")
	}
}

func TestEthCall_EmptyHexResult(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		resp := rpcResponse{JSONRPC: "2.0", ID: 1}
		resp.Result, _ = json.Marshal("0x")
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	client := newTestRPCClient([]string{srv.URL})

	result, err := client.EthCall(context.Background(), "0x1234", []byte{0x01})
	if err != nil {
		t.Fatalf("expected nil result without error for empty hex, got: %v", err)
	}
	if result != nil {
		t.Errorf("expected nil result for empty hex response, got: %s", hex.EncodeToString(result))
	}
}

func TestEthCall_RPCError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		resp := map[string]any{
			"jsonrpc": "2.0",
			"id":      1,
			"error":   map[string]any{"code": -32000, "message": "execution reverted"},
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	client := newTestRPCClient([]string{srv.URL})

	_, err := client.EthCall(context.Background(), "0x1234", []byte{0x01})
	if err == nil {
		t.Fatal("expected error for RPC error response")
	}
	if !strings.Contains(err.Error(), "execution reverted") {
		t.Errorf("expected 'execution reverted' in error, got: %v", err)
	}
}

func TestEthCall_NoEndpoints(t *testing.T) {
	client := newTestRPCClient([]string{})

	_, err := client.EthCall(context.Background(), "0x1234", []byte{0x01})
	if err == nil {
		t.Fatal("expected error with no endpoints")
	}
	if !strings.Contains(err.Error(), "no RPC endpoints available") {
		t.Errorf("unexpected error: %v", err)
	}
}

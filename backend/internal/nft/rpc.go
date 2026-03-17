package nft

import (
	"bytes"
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/rotki/rotki.com/backend/internal/safedialer"
)

// RPCClient makes JSON-RPC eth_call requests with fallback across multiple RPC URLs.
type RPCClient struct {
	urls       []string
	httpClient *http.Client
	logger     *slog.Logger
	mu         sync.RWMutex
	failures   map[string]time.Time // circuit breaker: URL -> last failure time
}

// NewRPCClient creates a new RPC client with the given URLs.
func NewRPCClient(urls []string, logger *slog.Logger) *RPCClient {
	return &RPCClient{
		urls: urls,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				DialContext:         safedialer.New(),
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 10,
				IdleConnTimeout:     90 * time.Second,
			},
		},
		logger:   logger.With("component", "rpc"),
		failures: make(map[string]time.Time),
	}
}

const circuitBreakerCooldown = 60 * time.Second

// UpdateURLs replaces the RPC URL list and resets the circuit breaker state.
func (c *RPCClient) UpdateURLs(urls []string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.urls = urls
	c.failures = make(map[string]time.Time)
}

// isAvailable checks if an RPC URL is not in circuit breaker cooldown.
func (c *RPCClient) isAvailable(url string) bool {
	c.mu.RLock()
	failTime, failed := c.failures[url]
	c.mu.RUnlock()
	if !failed {
		return true
	}
	if time.Since(failTime) > circuitBreakerCooldown {
		c.mu.Lock()
		delete(c.failures, url)
		c.mu.Unlock()
		return true
	}
	return false
}

// markFailed marks an RPC URL as failed (circuit breaker open).
func (c *RPCClient) markFailed(url string) {
	c.mu.Lock()
	c.failures[url] = time.Now()
	c.mu.Unlock()
}

// rpcRequest is a JSON-RPC request.
type rpcRequest struct {
	JSONRPC string `json:"jsonrpc"`
	Method  string `json:"method"`
	Params  []any  `json:"params"`
	ID      int    `json:"id"`
}

// rpcResponse is a JSON-RPC response.
type rpcResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	Result  json.RawMessage `json:"result"`
	Error   *rpcError       `json:"error"`
	ID      int             `json:"id"`
}

type rpcError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// EthCall executes an eth_call and returns the raw hex result bytes.
// Falls back across configured RPC URLs on failure.
func (c *RPCClient) EthCall(ctx context.Context, to string, data []byte) ([]byte, error) {
	callData := "0x" + hex.EncodeToString(data)
	params := []any{
		map[string]string{
			"to":   to,
			"data": callData,
		},
		"latest",
	}

	var lastErr error
	for _, rpcURL := range c.urls {
		if !c.isAvailable(rpcURL) {
			continue
		}

		result, err := c.doCall(ctx, rpcURL, "eth_call", params)
		if err != nil {
			c.logger.Warn("RPC call failed, trying next", "url", rpcURL, "error", err)
			c.markFailed(rpcURL)
			lastErr = err
			continue
		}

		return result, nil
	}

	if lastErr != nil {
		return nil, fmt.Errorf("all RPC endpoints failed, last error: %w", lastErr)
	}
	return nil, fmt.Errorf("no RPC endpoints available")
}

// doCall makes a single JSON-RPC call to the given URL.
func (c *RPCClient) doCall(ctx context.Context, rpcURL, method string, params []any) ([]byte, error) {
	reqBody, err := json.Marshal(rpcRequest{
		JSONRPC: "2.0",
		Method:  method,
		Params:  params,
		ID:      1,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, rpcURL, bytes.NewReader(reqBody))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req) //nolint:gosec // G704: RPC URL is from validated config, not user input
	if err != nil {
		return nil, fmt.Errorf("http request: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20)) // 1MB limit
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("RPC returned %d: %s", resp.StatusCode, string(body))
	}

	var rpcResp rpcResponse
	if err := json.Unmarshal(body, &rpcResp); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}

	if rpcResp.Error != nil {
		return nil, fmt.Errorf("RPC error %d: %s", rpcResp.Error.Code, rpcResp.Error.Message)
	}

	// Parse hex result
	var hexResult string
	if err := json.Unmarshal(rpcResp.Result, &hexResult); err != nil {
		return nil, fmt.Errorf("unmarshal result: %w", err)
	}

	hexResult = strings.TrimPrefix(hexResult, "0x")
	if hexResult == "" {
		return nil, nil
	}

	return hex.DecodeString(hexResult)
}

// Multicall executes a batch of calls via the Multicall3 contract.
func (c *RPCClient) Multicall(ctx context.Context, calls []MulticallCall) ([]MulticallResult, error) {
	encoded, err := EncodeMulticall3(calls)
	if err != nil {
		return nil, fmt.Errorf("encode multicall: %w", err)
	}

	result, err := c.EthCall(ctx, Multicall3Address, encoded)
	if err != nil {
		return nil, fmt.Errorf("multicall eth_call: %w", err)
	}

	if result == nil {
		return nil, fmt.Errorf("multicall returned empty result")
	}

	return DecodeMulticall3Result(result)
}

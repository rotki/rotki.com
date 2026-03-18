package nft

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"
)

// ConfigService fetches and caches NFT contract configuration from the backend API.
type ConfigService struct {
	baseURL    string
	httpClient *http.Client
	logger     *slog.Logger

	mu                  sync.Mutex
	lastContractAddress string
}

// NewConfigService creates a new config service.
// If insecure is true, TLS certificate verification is skipped (dev only).
func NewConfigService(baseURL string, insecure bool, logger *slog.Logger) *ConfigService {
	client := &http.Client{
		Timeout: 15 * time.Second,
	}
	if insecure {
		client.Transport = &http.Transport{
			TLSClientConfig: &tls.Config{MinVersion: tls.VersionTLS12, InsecureSkipVerify: true}, //nolint:gosec // dev only, gated on PROXY_INSECURE
		}
	}
	return &ConfigService{
		baseURL:    strings.TrimRight(baseURL, "/"),
		httpClient: client,
		logger:     logger.With("component", "nft-config"),
	}
}

// Fetch retrieves the current NFT config from the backend API.
func (s *ConfigService) Fetch(ctx context.Context) (*Config, error) {
	url := s.baseURL + "/webapi/nfts/release/current/"
	s.logger.Debug("fetching sponsorship metadata", "url", url)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := s.httpClient.Do(req) //nolint:gosec // G704: URL is from validated config (BaseURL), not user input
	if err != nil {
		return nil, fmt.Errorf("fetch config: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return nil, fmt.Errorf("config API returned %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	// Backend returns snake_case — parse directly
	var raw struct {
		Chain           string `json:"chain"`
		ContractAddress string `json:"contract_address"`
		ReleaseID       int    `json:"release_id"`
	}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}

	// Look up chain config
	chainCfg, ok := ChainConfigs[raw.Chain]
	if !ok {
		return nil, fmt.Errorf("unsupported chain: %s", raw.Chain)
	}

	// Detect contract address changes
	s.mu.Lock()
	hasChanged := s.lastContractAddress != "" && s.lastContractAddress != raw.ContractAddress
	if hasChanged {
		s.logger.Warn("contract address changed",
			"from", s.lastContractAddress,
			"to", raw.ContractAddress,
		)
	}
	s.lastContractAddress = raw.ContractAddress
	s.mu.Unlock()

	return &Config{
		ChainID:            chainCfg.ChainID,
		ContractAddress:    raw.ContractAddress,
		ReleaseID:          raw.ReleaseID,
		HasContractChanged: hasChanged,
		RPCURLs:            chainCfg.RPCURLs,
	}, nil
}

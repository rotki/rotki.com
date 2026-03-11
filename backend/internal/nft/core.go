package nft

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/rotki/rotki.com/backend/internal/safedialer"
)

// ErrTokenNotFound is returned when a token ID does not exist on-chain.
var ErrTokenNotFound = errors.New("token not found")

// maxInflight is the maximum number of concurrent dedup metadata fetch entries.
const maxInflight = 50

// configTTL is how long the cached NFT config is valid before re-fetching.
// This allows contract address changes to take effect without a restart.
const configTTL = 30 * time.Minute

// CoreService is the main NFT orchestration service.
// It coordinates blockchain, caching, and metadata operations.
type CoreService struct {
	blockchain *BlockchainService
	cache      *CacheManager
	configSvc  *ConfigService
	httpClient *http.Client
	logger     *slog.Logger

	mu              sync.Mutex
	cachedConfig    *Config
	configFetchedAt time.Time

	// Request deduplication for metadata fetches
	dedupMu  sync.Mutex
	inflight map[string]*inflightRequest
}

type inflightRequest struct {
	done   chan struct{}
	result *TierMetadata
	err    error
}

// NewCoreService creates a new NFT core service.
func NewCoreService(blockchain *BlockchainService, cache *CacheManager, configSvc *ConfigService, logger *slog.Logger) *CoreService {
	return &CoreService{
		blockchain: blockchain,
		cache:      cache,
		configSvc:  configSvc,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				DialContext:         safedialer.New(),
				MaxIdleConns:        50,
				MaxIdleConnsPerHost: 10,
				IdleConnTimeout:     90 * time.Second,
			},
		},
		logger:   logger.With("component", "nft-core"),
		inflight: make(map[string]*inflightRequest),
	}
}

// GetConfig returns the NFT config, fetching and caching it if needed.
// The config is refreshed after configTTL to pick up contract changes without restart.
// Uses double-checked locking to avoid holding the mutex during the network call.
func (s *CoreService) GetConfig(ctx context.Context) (*Config, error) {
	s.mu.Lock()
	if s.cachedConfig != nil && time.Since(s.configFetchedAt) < configTTL {
		cfg := s.cachedConfig
		s.mu.Unlock()
		return cfg, nil
	}
	s.mu.Unlock()

	cfg, err := s.configSvc.Fetch(ctx)
	if err != nil {
		// If we have a stale config and fetch fails, return stale rather than error
		s.mu.Lock()
		if s.cachedConfig != nil {
			stale := s.cachedConfig
			s.mu.Unlock()
			s.logger.Warn("config refresh failed, using stale config", "error", err)
			return stale, nil
		}
		s.mu.Unlock()
		return nil, err
	}

	s.mu.Lock()
	s.cachedConfig = cfg
	s.configFetchedAt = time.Now()
	s.mu.Unlock()

	if cfg.HasContractChanged {
		s.logger.Warn("contract address changed, clearing caches")
	}

	return cfg, nil
}

// UpdateCachedReleaseID updates the cached release ID.
func (s *CoreService) UpdateCachedReleaseID(releaseID int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.cachedConfig != nil {
		s.cachedConfig.ReleaseID = releaseID
		s.logger.Info("updated cached release ID", "release_id", releaseID)
	}
}

// FetchMetadata fetches metadata from IPFS with caching and deduplication.
func (s *CoreService) FetchMetadata(ctx context.Context, metadataURI string) (*TierMetadata, error) {
	// Check cache first
	if cached, ok := s.cache.GetMetadata(ctx, metadataURI); ok {
		return cached, nil
	}

	// Deduplicate concurrent requests for the same URI
	s.dedupMu.Lock()
	if req, ok := s.inflight[metadataURI]; ok {
		s.dedupMu.Unlock()
		select {
		case <-req.done:
			return req.result, req.err
		case <-ctx.Done():
			return nil, ctx.Err()
		}
	}

	if len(s.inflight) >= maxInflight {
		s.dedupMu.Unlock()
		return nil, fmt.Errorf("too many concurrent metadata fetches")
	}

	req := &inflightRequest{done: make(chan struct{})}
	s.inflight[metadataURI] = req
	s.dedupMu.Unlock()

	defer func() {
		close(req.done)
		s.dedupMu.Lock()
		delete(s.inflight, metadataURI)
		s.dedupMu.Unlock()
	}()

	// Fetch from IPFS gateway
	metadataURL := NormalizeIPFSURL(metadataURI)
	metadata, err := s.fetchMetadataHTTP(ctx, metadataURL)
	if err != nil {
		req.err = err
		return nil, err
	}

	// Cache the result
	s.cache.SetMetadata(ctx, metadataURI, metadata)
	req.result = metadata
	return metadata, nil
}

// fetchMetadataHTTP fetches metadata JSON with retry.
func (s *CoreService) fetchMetadataHTTP(ctx context.Context, url string) (*TierMetadata, error) {
	var lastErr error
	for attempt := range 3 {
		if attempt > 0 {
			delay := time.Duration(500*(1<<attempt)) * time.Millisecond
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(delay):
			}
		}

		httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return nil, fmt.Errorf("create request: %w", err)
		}

		resp, err := s.httpClient.Do(httpReq) //nolint:gosec // G704: URL is from blockchain metadata (IPFS/HTTPS), not user input
		if err != nil {
			lastErr = err
			continue
		}

		body, readErr := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
		_ = resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			lastErr = fmt.Errorf("metadata fetch returned %d", resp.StatusCode)
			// Don't retry 4xx (except 429)
			if resp.StatusCode >= 400 && resp.StatusCode < 500 && resp.StatusCode != http.StatusTooManyRequests {
				return nil, lastErr
			}
			continue
		}

		if readErr != nil {
			lastErr = readErr
			continue
		}

		var metadata TierMetadata
		if err := json.Unmarshal(body, &metadata); err != nil {
			return nil, fmt.Errorf("parse metadata: %w", err)
		}

		return &metadata, nil
	}

	return nil, fmt.Errorf("metadata fetch failed after retries: %w", lastErr)
}

// FetchTokenData fetches full token data from blockchain + IPFS.
func (s *CoreService) FetchTokenData(ctx context.Context, tokenID int) (*TokenMetadata, error) {
	cfg, err := s.GetConfig(ctx)
	if err != nil {
		return nil, err
	}

	basicData, err := s.blockchain.FetchTokenBasicData(ctx, cfg, tokenID)
	if err != nil {
		return nil, fmt.Errorf("fetch token basic data: %w", err)
	}
	if basicData == nil {
		return nil, nil // token doesn't exist
	}

	// Get or fetch tier info
	tierInfo, _ := s.cache.GetSingleTierInfo(ctx, basicData.TierID, cfg, basicData.ReleaseID)
	if tierInfo == nil {
		blockchainTier, fetchErr := s.blockchain.FetchTierInfo(ctx, cfg, basicData.ReleaseID, basicData.TierID)
		if fetchErr == nil && blockchainTier != nil {
			tierInfo = &TierInfoResult{
				MaxSupply:     blockchainTier.MaxSupply,
				CurrentSupply: blockchainTier.CurrentSupply,
				MetadataURI:   blockchainTier.MetadataURI,
			}
		}
	}

	// Fetch token metadata
	metadata, err := s.FetchMetadata(ctx, basicData.MetadataURI)
	if err != nil {
		return nil, fmt.Errorf("fetch token metadata: %w", err)
	}

	imageURL := ProcessImageURL(metadata)
	releaseName := ""

	// Try to get release name from tier metadata
	if tierInfo != nil && tierInfo.MetadataURI != "" {
		tierMetadata, err := s.FetchMetadata(ctx, tierInfo.MetadataURI)
		if err == nil {
			tierImageURL, benefits, extractedRelease := ProcessTierMetadata(tierMetadata)
			releaseName = extractedRelease

			if tierInfo.Benefits == "" && tierInfo.ImageURL == "" && tierInfo.ReleaseName == "" {
				tierInfo.Benefits = benefits
				tierInfo.ImageURL = tierImageURL
				tierInfo.ReleaseName = releaseName
				s.cache.SetSingleTierInfo(ctx, basicData.TierID, tierInfo, cfg, basicData.ReleaseID)
			}
		}
	}

	tierName := "bronze"
	if tier := FindTierByID(basicData.TierID); tier != nil {
		tierName = tier.Key
	}

	return &TokenMetadata{
		ImageURL:    imageURL,
		Metadata:    metadata,
		MetadataURI: basicData.MetadataURI,
		Owner:       basicData.Owner,
		ReleaseID:   basicData.ReleaseID,
		ReleaseName: releaseName,
		TierID:      basicData.TierID,
		TierName:    tierName,
		TokenID:     tokenID,
	}, nil
}

// FetchCachedTokenData returns cached token data, or fetches and caches it.
func (s *CoreService) FetchCachedTokenData(ctx context.Context, tokenID int) (*TokenMetadata, error) {
	cfg, err := s.GetConfig(ctx)
	if err != nil {
		return nil, err
	}

	if cached, ok := s.cache.GetTokenData(ctx, tokenID, cfg); ok {
		return cached, nil
	}

	tokenData, err := s.FetchTokenData(ctx, tokenID)
	if err != nil {
		return nil, err
	}
	if tokenData == nil {
		return nil, ErrTokenNotFound
	}

	s.cache.SetTokenData(ctx, tokenID, tokenData, cfg)
	return tokenData, nil
}

// FetchTiers fetches tier data with intelligent caching.
func (s *CoreService) FetchTiers(ctx context.Context, tierIDs []int) (*TiersResponse, error) {
	if len(tierIDs) == 0 {
		return &TiersResponse{Tiers: make(map[int]TierInfoResult)}, nil
	}

	cfg, err := s.GetConfig(ctx)
	if err != nil {
		return nil, err
	}

	releaseID := cfg.ReleaseID
	allTiers := make(map[int]TierInfoResult)

	if releaseID > 0 {
		cached, missing := s.cache.GetCachedTierInfo(ctx, tierIDs, cfg, releaseID)
		for k, v := range cached {
			allTiers[k] = v
		}

		if len(missing) > 0 {
			fetched, err := s.fetchAndCacheMissingTiers(ctx, missing, cfg, releaseID)
			if err != nil {
				s.logger.Error("error fetching missing tiers", "error", err)
			}
			for k, v := range fetched {
				allTiers[k] = v
			}
		}
	} else {
		s.logger.Debug("no release ID available, fetching from blockchain")
		rid, err := s.blockchain.GetCurrentReleaseID(ctx, cfg)
		if err != nil {
			return nil, fmt.Errorf("get release ID: %w", err)
		}
		releaseID = rid
		s.UpdateCachedReleaseID(releaseID)

		fetched, err := s.fetchAndCacheMissingTiers(ctx, tierIDs, cfg, releaseID)
		if err != nil {
			return nil, err
		}
		allTiers = fetched
	}

	return &TiersResponse{
		ReleaseID: &releaseID,
		Tiers:     allTiers,
	}, nil
}

// FetchAllTiersForRelease fetches all tiers without checking cache — used by cache updater.
func (s *CoreService) FetchAllTiersForRelease(ctx context.Context, tierIDs []int) (int, map[int]*TierInfoResult, error) {
	cfg, err := s.GetConfig(ctx)
	if err != nil {
		return 0, nil, err
	}

	releaseID := cfg.ReleaseID
	if releaseID == 0 {
		releaseID, err = s.blockchain.GetCurrentReleaseID(ctx, cfg)
		if err != nil {
			return 0, nil, fmt.Errorf("get release ID: %w", err)
		}
	}

	tierInfos, err := s.blockchain.FetchMultipleTierInfo(ctx, cfg, releaseID, tierIDs)
	if err != nil {
		return 0, nil, err
	}

	results := make(map[int]*TierInfoResult)
	for tierID, info := range tierInfos {
		if info == nil {
			results[tierID] = nil
			continue
		}

		result := &TierInfoResult{
			MaxSupply:     info.MaxSupply,
			CurrentSupply: info.CurrentSupply,
			MetadataURI:   info.MetadataURI,
		}

		// Try to fetch and process metadata
		if info.MetadataURI != "" {
			metadata, err := s.FetchMetadata(ctx, info.MetadataURI)
			if err == nil {
				result.ImageURL, result.Benefits, result.ReleaseName = ProcessTierMetadata(metadata)
			}
		}

		results[tierID] = result
	}

	// Store in cache
	s.cache.StoreTierInfo(ctx, results, cfg, releaseID)

	return releaseID, results, nil
}

// GetTierImageURL returns the raw IPFS image URL for a tier, using cache or blockchain fallback.
func (s *CoreService) GetTierImageURL(ctx context.Context, tierID int) (string, error) {
	cfg, err := s.GetConfig(ctx)
	if err != nil {
		return "", err
	}

	releaseID := cfg.ReleaseID
	if releaseID == 0 {
		releaseID, err = s.blockchain.GetCurrentReleaseID(ctx, cfg)
		if err != nil {
			return "", fmt.Errorf("get release ID: %w", err)
		}
	}

	// Check cache
	if info, ok := s.cache.GetSingleTierInfo(ctx, tierID, cfg, releaseID); ok && info.ImageURL != "" {
		return info.ImageURL, nil
	}

	// Fallback: fetch from blockchain
	fetched, err := s.fetchAndCacheMissingTiers(ctx, []int{tierID}, cfg, releaseID)
	if err != nil {
		return "", err
	}

	if info, ok := fetched[tierID]; ok && info.ImageURL != "" {
		return info.ImageURL, nil
	}

	return "", fmt.Errorf("no image URL for tier %d", tierID)
}

// GetTokenImageURL returns the raw IPFS image URL for a token, using cache or blockchain fallback.
func (s *CoreService) GetTokenImageURL(ctx context.Context, tokenID int) (string, error) {
	tokenData, err := s.FetchCachedTokenData(ctx, tokenID)
	if err != nil {
		return "", err
	}
	if tokenData.ImageURL == "" {
		return "", fmt.Errorf("no image URL for token %d", tokenID)
	}
	return tokenData.ImageURL, nil
}

// fetchAndCacheMissingTiers fetches tiers from blockchain and caches them.
func (s *CoreService) fetchAndCacheMissingTiers(ctx context.Context, tierIDs []int, cfg *Config, releaseID int) (map[int]TierInfoResult, error) {
	tierInfos, err := s.blockchain.FetchMultipleTierInfo(ctx, cfg, releaseID, tierIDs)
	if err != nil {
		return nil, err
	}

	results := make(map[int]TierInfoResult)
	toCache := make(map[int]*TierInfoResult)

	for tierID, info := range tierInfos {
		if info == nil || info.MetadataURI == "" {
			continue
		}

		metadata, err := s.FetchMetadata(ctx, info.MetadataURI)
		if err != nil {
			s.logger.Error("error processing tier metadata", "tier_id", tierID, "error", err)
			continue
		}

		imageURL, benefits, releaseName := ProcessTierMetadata(metadata)
		result := TierInfoResult{
			MaxSupply:     info.MaxSupply,
			CurrentSupply: info.CurrentSupply,
			MetadataURI:   info.MetadataURI,
			ImageURL:      imageURL,
			Benefits:      benefits,
			ReleaseName:   releaseName,
		}
		results[tierID] = result
		toCache[tierID] = &result
	}

	s.cache.StoreTierInfo(ctx, toCache, cfg, releaseID)

	return results, nil
}

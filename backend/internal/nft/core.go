package nft

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"slices"
	"sync"
	"time"

	"github.com/rotki/rotki.com/backend/internal/ipfs"
	"github.com/rotki/rotki.com/backend/internal/safedialer"
)

// ErrTokenNotFound is returned when a token ID does not exist on-chain.
var ErrTokenNotFound = errors.New("token not found")

// ErrReleaseNotFound is returned when a requested release is newer than the current release.
var ErrReleaseNotFound = errors.New("release not found")

// ErrMetadataUnavailable is returned for metadata recently confirmed missing or unusable.
var ErrMetadataUnavailable = errors.New("metadata unavailable")

// metadataFetchTimeout bounds a shared metadata fetch across all gateways.
const metadataFetchTimeout = 30 * time.Second

// maxInflight is the maximum number of concurrent dedup metadata fetch entries.
const maxInflight = 50

// metadataGatewayTimeout bounds a single metadata request to one IPFS gateway.
const metadataGatewayTimeout = 8 * time.Second

// configTTL is how long the cached NFT config is valid before re-fetching.
// This allows contract address changes to take effect without a restart.
const configTTL = 30 * time.Minute

// CoreService is the main NFT orchestration service.
// It coordinates blockchain, caching, and metadata operations.
type CoreService struct {
	blockchain *BlockchainService
	cache      *CacheManager
	configSvc  *ConfigService
	gateways   *ipfs.Pool
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
func NewCoreService(blockchain *BlockchainService, cache *CacheManager, configSvc *ConfigService, gateways *ipfs.Pool, logger *slog.Logger) *CoreService {
	return &CoreService{
		blockchain: blockchain,
		cache:      cache,
		configSvc:  configSvc,
		gateways:   gateways,
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

	// Update RPC URLs to match the chain from the config API
	if len(cfg.RPCURLs) > 0 {
		s.blockchain.UpdateRPCURLs(cfg.RPCURLs)
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

// ClearConfig clears the cached NFT config, forcing a re-fetch on next access.
func (s *CoreService) ClearConfig() {
	s.mu.Lock()
	s.cachedConfig = nil
	s.configFetchedAt = time.Time{}
	s.mu.Unlock()
	s.logger.Info("cleared cached NFT config")
}

// InvalidateAll clears all NFT caches (Redis keys + in-memory config).
func (s *CoreService) InvalidateAll(ctx context.Context) (int, error) {
	s.ClearConfig()
	return s.cache.InvalidateAll(ctx)
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
//
// Concurrent callers share one fetch, which runs detached from the caller that started it
// (bounded by metadataFetchTimeout): a client disconnecting doesn't fail the other waiters,
// and a fetch that finishes after every caller left still fills the cache. Metadata
// confirmed missing is remembered for MetadataMissTTL and returns ErrMetadataUnavailable.
func (s *CoreService) FetchMetadata(ctx context.Context, metadataURI string) (*TierMetadata, error) {
	// Check cache first
	if cached, ok := s.cache.GetMetadata(ctx, metadataURI); ok {
		return cached, nil
	}
	if s.cache.IsMetadataMissing(ctx, metadataURI) {
		return nil, fmt.Errorf("%w: %s recently confirmed missing", ErrMetadataUnavailable, metadataURI)
	}

	// Deduplicate concurrent requests for the same URI
	s.dedupMu.Lock()
	req, ok := s.inflight[metadataURI]
	if !ok {
		if len(s.inflight) >= maxInflight {
			s.dedupMu.Unlock()
			return nil, fmt.Errorf("too many concurrent metadata fetches")
		}
		req = &inflightRequest{done: make(chan struct{})}
		s.inflight[metadataURI] = req
		go s.runMetadataFetch(context.WithoutCancel(ctx), metadataURI, req)
	}
	s.dedupMu.Unlock()

	select {
	case <-req.done:
		return req.result, req.err
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

// runMetadataFetch performs a shared metadata fetch, caches the result (or a confirmed miss),
// and publishes it to waiters. req's result fields are written once, before done is closed.
func (s *CoreService) runMetadataFetch(ctx context.Context, metadataURI string, req *inflightRequest) {
	ctx, cancel := context.WithTimeout(ctx, metadataFetchTimeout)
	defer cancel()

	metadata, err := s.fetchMetadataHTTP(ctx, metadataURI)
	switch {
	case err == nil:
		s.cache.SetMetadata(ctx, metadataURI, metadata)
	case isPermanentMetadataError(err):
		s.cache.SetMetadataMissing(ctx, metadataURI)
		s.logger.Warn("metadata confirmed missing, remembering briefly",
			"uri", metadataURI, "ttl", MetadataMissTTL, "error", err)
	}

	req.result, req.err = metadata, err
	close(req.done)

	s.dedupMu.Lock()
	delete(s.inflight, metadataURI)
	s.dedupMu.Unlock()
}

// isPermanentMetadataError reports whether a metadata fetch failed because the content is
// missing or unusable, rather than because gateways were slow, rate limited, or down.
// The gateway pool only wraps a 404 when every configured gateway confirmed it.
func isPermanentMetadataError(err error) bool {
	if errors.Is(err, ErrMetadataUnavailable) || errors.Is(err, ipfs.ErrContentRejected) {
		return true
	}
	var sc ipfs.StatusCoder
	return errors.As(err, &sc) && sc.HTTPStatus() == http.StatusNotFound
}

// fetchMetadataHTTP fetches metadata JSON. IPFS URIs go through the gateway pool
// (one attempt per gateway, with cooldowns); other URLs get a single attempt.
func (s *CoreService) fetchMetadataHTTP(ctx context.Context, uri string) (*TierMetadata, error) {
	if !s.gateways.IsIPFS(uri) {
		return s.fetchMetadataOnce(ctx, uri)
	}

	var metadata *TierMetadata
	err := s.gateways.Fetch(ctx, uri, metadataGatewayTimeout, func(ctx context.Context, url string) error {
		m, err := s.fetchMetadataOnce(ctx, url)
		if err != nil {
			return err
		}
		metadata = m
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("fetch metadata %s: %w", uri, err)
	}
	return metadata, nil
}

// fetchMetadataOnce performs a single metadata request and parses the JSON body.
// A body that isn't valid metadata JSON (e.g. a gateway's HTML landing page) is an error.
func (s *CoreService) fetchMetadataOnce(ctx context.Context, url string) (*TierMetadata, error) {
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	httpReq.Header.Set("Accept", "application/json")
	httpReq.Header.Set("User-Agent", "rotki.com/1.0")

	resp, err := s.httpClient.Do(httpReq) //nolint:gosec // G704: URL is from blockchain metadata (IPFS/HTTPS), not user input
	if err != nil {
		return nil, err
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return nil, &ipfs.StatusError{StatusCode: resp.StatusCode, RetryAfter: resp.Header.Get("Retry-After")}
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, fmt.Errorf("read metadata: %w", err)
	}

	var metadata TierMetadata
	if err := json.Unmarshal(body, &metadata); err != nil {
		// An HTML page (landing page, bot challenge) is the gateway's fault: try the next one.
		// Anything else that fails to parse would fail on every gateway.
		if ipfs.IsHTML(resp.Header.Get("Content-Type"), body) {
			return nil, fmt.Errorf("gateway returned HTML instead of metadata: %w", err)
		}
		return nil, fmt.Errorf("%w: parse metadata: %w", ipfs.ErrContentRejected, err)
	}
	return &metadata, nil
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
// It also returns the IDs of tiers whose metadata failed transiently (and had no previous
// cached metadata to fall back on); those are not cached so they are retried. Tiers whose
// metadata is confirmed missing are cached without artwork for TierMissTTL instead, and are
// not reported, since retrying sooner won't help.
func (s *CoreService) FetchAllTiersForRelease(ctx context.Context, tierIDs []int) (int, map[int]*TierInfoResult, []int, error) {
	cfg, err := s.GetConfig(ctx)
	if err != nil {
		return 0, nil, nil, err
	}

	releaseID := cfg.ReleaseID
	if releaseID == 0 {
		releaseID, err = s.blockchain.GetCurrentReleaseID(ctx, cfg)
		if err != nil {
			return 0, nil, nil, fmt.Errorf("get release ID: %w", err)
		}
	}

	tierInfos, err := s.blockchain.FetchMultipleTierInfo(ctx, cfg, releaseID, tierIDs)
	if err != nil {
		return 0, nil, nil, err
	}

	results := make(map[int]*TierInfoResult)
	var metadataFailures, metadataMissing []int
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
			} else {
				s.logger.Warn("tier metadata fetch failed",
					"tier_id", tierID, "release_id", releaseID, "uri", info.MetadataURI, "error", err)
				prev, ok := s.cache.GetSingleTierInfo(ctx, tierID, cfg, releaseID)
				switch {
				case ok && prev.MetadataURI == info.MetadataURI && hasMetadata(prev):
					// Keep the last good metadata so a failure doesn't wipe the image
					result.ImageURL, result.Benefits, result.ReleaseName = prev.ImageURL, prev.Benefits, prev.ReleaseName
				case isPermanentMetadataError(err):
					metadataMissing = append(metadataMissing, tierID)
				default:
					metadataFailures = append(metadataFailures, tierID)
				}
			}
		}

		results[tierID] = result
	}

	// Don't cache tiers whose metadata failed transiently, so they are retried instead of
	// cached empty. Confirmed misses are cached briefly without artwork so page loads don't
	// repeat the chain call and gateway attempts. Everything else is cached as usual.
	s.cache.StoreTierInfo(ctx, withoutTiers(results, slices.Concat(metadataFailures, metadataMissing)), cfg, releaseID)
	s.cache.StoreTierInfoWithTTL(ctx, onlyTiers(results, metadataMissing), cfg, releaseID, TierMissTTL)

	return releaseID, results, metadataFailures, nil
}

// hasMetadata reports whether a cached tier carries fields from successfully fetched metadata.
func hasMetadata(info *TierInfoResult) bool {
	return info.ImageURL != "" || info.Benefits != "" || info.ReleaseName != ""
}

// withoutTiers returns tiers minus the given tier IDs.
func withoutTiers(tiers map[int]*TierInfoResult, skip []int) map[int]*TierInfoResult {
	filtered := make(map[int]*TierInfoResult, len(tiers))
	for tierID, info := range tiers {
		if !slices.Contains(skip, tierID) {
			filtered[tierID] = info
		}
	}
	return filtered
}

// onlyTiers returns the subset of tiers with the given tier IDs.
func onlyTiers(tiers map[int]*TierInfoResult, keep []int) map[int]*TierInfoResult {
	filtered := make(map[int]*TierInfoResult, len(keep))
	for _, tierID := range keep {
		if info, ok := tiers[tierID]; ok {
			filtered[tierID] = info
		}
	}
	return filtered
}

// GetTierImageURL returns the raw IPFS image URL for a tier, using cache or blockchain fallback.
// A releaseID of 0 means the current release. Releases newer than the current
// one return ErrReleaseNotFound without touching the blockchain.
func (s *CoreService) GetTierImageURL(ctx context.Context, tierID, releaseID int) (string, error) {
	cfg, err := s.GetConfig(ctx)
	if err != nil {
		return "", err
	}

	currentReleaseID := cfg.ReleaseID
	if currentReleaseID == 0 {
		currentReleaseID, err = s.blockchain.GetCurrentReleaseID(ctx, cfg)
		if err != nil {
			return "", fmt.Errorf("get release ID: %w", err)
		}
	}

	switch {
	case releaseID == 0:
		releaseID = currentReleaseID
	case releaseID > currentReleaseID:
		return "", ErrReleaseNotFound
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
	missing := make(map[int]*TierInfoResult)

	for tierID, info := range tierInfos {
		if info == nil {
			continue
		}

		result := TierInfoResult{
			MaxSupply:     info.MaxSupply,
			CurrentSupply: info.CurrentSupply,
			MetadataURI:   info.MetadataURI,
		}

		// A tier without metadata (not configured for this release) is cached as-is,
		// so it doesn't trigger a blockchain call on every request.
		if info.MetadataURI != "" {
			metadata, err := s.FetchMetadata(ctx, info.MetadataURI)
			switch {
			case err == nil:
				result.ImageURL, result.Benefits, result.ReleaseName = ProcessTierMetadata(metadata)
			case isPermanentMetadataError(err):
				// Confirmed missing: cache the tier without artwork briefly, so every request
				// doesn't repeat the chain call and gateway attempts
				s.logger.Warn("tier metadata missing, caching tier without artwork",
					"tier_id", tierID, "release_id", releaseID, "ttl", TierMissTTL, "error", err)
				results[tierID] = result
				missing[tierID] = &result
				continue
			default:
				s.logger.Error("error processing tier metadata", "tier_id", tierID, "error", err)
				continue
			}
		}

		results[tierID] = result
		toCache[tierID] = &result
	}

	s.cache.StoreTierInfo(ctx, toCache, cfg, releaseID)
	s.cache.StoreTierInfoWithTTL(ctx, missing, cfg, releaseID, TierMissTTL)

	return results, nil
}

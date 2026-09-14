package nft

import (
	"context"
	"log/slog"
	"time"

	"github.com/rotki/rotki.com/backend/internal/cache"
)

// Cache TTLs
const (
	MetadataCacheTTL  = 3 * time.Hour // outlives 2h scheduler interval
	TierDataCacheTTL  = 3 * time.Hour // outlives 2h scheduler interval
	TokenDataCacheTTL = 3 * time.Hour // outlives 2h scheduler interval

	// MetadataMissTTL remembers metadata confirmed missing (every gateway 404, or unusable
	// content) so page loads don't retry every gateway. Short, because a release's metadata
	// can be pinned shortly after it is published.
	MetadataMissTTL = 10 * time.Minute
	// TierMissTTL caches a tier whose metadata is confirmed missing, without artwork.
	TierMissTTL = 10 * time.Minute
)

// CacheManager handles NFT-related cache operations.
type CacheManager struct {
	redis  *cache.Redis
	logger *slog.Logger
}

// NewCacheManager creates a new NFT cache manager.
func NewCacheManager(redis *cache.Redis, logger *slog.Logger) *CacheManager {
	return &CacheManager{
		redis:  redis,
		logger: logger.With("component", "nft-cache"),
	}
}

// GetMetadata retrieves cached tier/token metadata.
func (m *CacheManager) GetMetadata(ctx context.Context, metadataURI string) (*TierMetadata, bool) {
	key := MetadataCacheKey(metadataURI)
	var metadata TierMetadata
	if m.redis.Get(ctx, key, &metadata) {
		m.logger.Debug("metadata cache hit", "uri", metadataURI)
		return &metadata, true
	}
	m.logger.Debug("metadata cache miss", "uri", metadataURI)
	return nil, false
}

// SetMetadata caches tier/token metadata.
func (m *CacheManager) SetMetadata(ctx context.Context, metadataURI string, metadata *TierMetadata) {
	key := MetadataCacheKey(metadataURI)
	_ = m.redis.Set(ctx, key, metadata, MetadataCacheTTL)
	m.logger.Debug("metadata cached", "uri", metadataURI, "ttl", MetadataCacheTTL)
}

// IsMetadataMissing reports whether metadata at a URI was recently confirmed missing.
func (m *CacheManager) IsMetadataMissing(ctx context.Context, metadataURI string) bool {
	var missing bool
	return m.redis.Get(ctx, MetadataMissCacheKey(metadataURI), &missing) && missing
}

// SetMetadataMissing remembers that metadata at a URI is confirmed missing, for MetadataMissTTL.
func (m *CacheManager) SetMetadataMissing(ctx context.Context, metadataURI string) {
	_ = m.redis.Set(ctx, MetadataMissCacheKey(metadataURI), true, MetadataMissTTL)
	m.logger.Debug("metadata miss cached", "uri", metadataURI, "ttl", MetadataMissTTL)
}

// GetSingleTierInfo retrieves cached tier info for one tier.
func (m *CacheManager) GetSingleTierInfo(ctx context.Context, tierID int, cfg *Config, releaseID int) (*TierInfoResult, bool) {
	key := TierCacheKey(cfg.ContractAddress, releaseID, tierID)
	var result TierInfoResult
	if m.redis.Get(ctx, key, &result) {
		m.logger.Debug("tier cache hit", "tier_id", tierID, "release_id", releaseID)
		return &result, true
	}
	m.logger.Debug("tier cache miss", "tier_id", tierID, "release_id", releaseID)
	return nil, false
}

// SetSingleTierInfo caches tier info for one tier.
func (m *CacheManager) SetSingleTierInfo(ctx context.Context, tierID int, tierInfo *TierInfoResult, cfg *Config, releaseID int) {
	m.setSingleTierInfo(ctx, tierID, tierInfo, cfg, releaseID, TierDataCacheTTL)
}

func (m *CacheManager) setSingleTierInfo(ctx context.Context, tierID int, tierInfo *TierInfoResult, cfg *Config, releaseID int, ttl time.Duration) {
	key := TierCacheKey(cfg.ContractAddress, releaseID, tierID)
	_ = m.redis.Set(ctx, key, tierInfo, ttl)
	m.logger.Debug("tier cached", "tier_id", tierID, "release_id", releaseID, "ttl", ttl)
}

// GetCachedTierInfo checks cache for multiple tiers, returns cached data and missing IDs.
func (m *CacheManager) GetCachedTierInfo(ctx context.Context, tierIDs []int, cfg *Config, releaseID int) (cached map[int]TierInfoResult, missing []int) {
	cached = make(map[int]TierInfoResult, len(tierIDs))
	missing = make([]int, 0, len(tierIDs))
	for _, tierID := range tierIDs {
		if result, ok := m.GetSingleTierInfo(ctx, tierID, cfg, releaseID); ok {
			cached[tierID] = *result
		} else {
			missing = append(missing, tierID)
		}
	}
	m.logger.Info("tier cache lookup", "requested", len(tierIDs), "hits", len(cached), "misses", len(missing))
	return cached, missing
}

// StoreTierInfo caches multiple tiers.
func (m *CacheManager) StoreTierInfo(ctx context.Context, tiers map[int]*TierInfoResult, cfg *Config, releaseID int) {
	m.StoreTierInfoWithTTL(ctx, tiers, cfg, releaseID, TierDataCacheTTL)
}

// StoreTierInfoWithTTL caches multiple tiers with a custom TTL.
func (m *CacheManager) StoreTierInfoWithTTL(ctx context.Context, tiers map[int]*TierInfoResult, cfg *Config, releaseID int, ttl time.Duration) {
	stored := 0
	for tierID, tierInfo := range tiers {
		if tierInfo != nil {
			m.setSingleTierInfo(ctx, tierID, tierInfo, cfg, releaseID, ttl)
			stored++
		}
	}
	if stored > 0 {
		m.logger.Info("tier cache store", "stored", stored, "release_id", releaseID, "ttl", ttl)
	}
}

// GetTokenData retrieves cached token data.
func (m *CacheManager) GetTokenData(ctx context.Context, tokenID int, cfg *Config) (*TokenMetadata, bool) {
	key := TokenCacheKey(cfg.ContractAddress, tokenID)
	var data TokenMetadata
	if m.redis.Get(ctx, key, &data) {
		m.logger.Debug("token cache hit", "token_id", tokenID)
		return &data, true
	}
	m.logger.Debug("token cache miss", "token_id", tokenID)
	return nil, false
}

// SetTokenData caches token data.
func (m *CacheManager) SetTokenData(ctx context.Context, tokenID int, data *TokenMetadata, cfg *Config) {
	key := TokenCacheKey(cfg.ContractAddress, tokenID)
	_ = m.redis.Set(ctx, key, data, TokenDataCacheTTL)
	m.logger.Debug("token cached", "token_id", tokenID, "ttl", TokenDataCacheTTL)
}

// InvalidateAll deletes all NFT-related keys from Redis using SCAN.
// Returns the total number of keys deleted.
func (m *CacheManager) InvalidateAll(ctx context.Context) (int, error) {
	patterns := []string{"tier:*", "metadata:*", "metadata-miss:*", "token:*", "image:*"}
	total := 0

	for _, pattern := range patterns {
		n, err := m.redis.ScanDelete(ctx, pattern)
		if err != nil {
			m.logger.Error("failed to scan-delete NFT keys", "pattern", pattern, "error", err)
			return total, err
		}
		total += n
	}

	m.logger.Info("invalidated all NFT caches", "keys_deleted", total)
	return total, nil
}

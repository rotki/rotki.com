package nft

import (
	"context"
	"log/slog"
	"time"

	"github.com/rotki/rotki.com/backend/internal/cache"
)

// Cache TTLs
const (
	MetadataCacheTTL  = time.Hour       // 1 hour
	TierDataCacheTTL  = 5 * time.Minute // 5 minutes
	TokenDataCacheTTL = 5 * time.Minute // 5 minutes
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
		return &metadata, true
	}
	return nil, false
}

// SetMetadata caches tier/token metadata.
func (m *CacheManager) SetMetadata(ctx context.Context, metadataURI string, metadata *TierMetadata) {
	key := MetadataCacheKey(metadataURI)
	_ = m.redis.Set(ctx, key, metadata, MetadataCacheTTL)
}

// GetSingleTierInfo retrieves cached tier info for one tier.
func (m *CacheManager) GetSingleTierInfo(ctx context.Context, tierID int, cfg *Config, releaseID int) (*TierInfoResult, bool) {
	key := TierCacheKey(cfg.ContractAddress, releaseID, tierID)
	var result TierInfoResult
	if m.redis.Get(ctx, key, &result) {
		return &result, true
	}
	return nil, false
}

// SetSingleTierInfo caches tier info for one tier.
func (m *CacheManager) SetSingleTierInfo(ctx context.Context, tierID int, tierInfo *TierInfoResult, cfg *Config, releaseID int) {
	key := TierCacheKey(cfg.ContractAddress, releaseID, tierID)
	_ = m.redis.Set(ctx, key, tierInfo, TierDataCacheTTL)
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
	return cached, missing
}

// StoreTierInfo caches multiple tiers.
func (m *CacheManager) StoreTierInfo(ctx context.Context, tiers map[int]*TierInfoResult, cfg *Config, releaseID int) {
	for tierID, tierInfo := range tiers {
		if tierInfo != nil {
			m.SetSingleTierInfo(ctx, tierID, tierInfo, cfg, releaseID)
		}
	}
}

// GetTokenData retrieves cached token data.
func (m *CacheManager) GetTokenData(ctx context.Context, tokenID int, cfg *Config) (*TokenMetadata, bool) {
	key := TokenCacheKey(cfg.ContractAddress, tokenID)
	var data TokenMetadata
	if m.redis.Get(ctx, key, &data) {
		return &data, true
	}
	return nil, false
}

// SetTokenData caches token data.
func (m *CacheManager) SetTokenData(ctx context.Context, tokenID int, data *TokenMetadata, cfg *Config) {
	key := TokenCacheKey(cfg.ContractAddress, tokenID)
	_ = m.redis.Set(ctx, key, data, TokenDataCacheTTL)
}

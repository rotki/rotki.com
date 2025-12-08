import type { NftConfig, TierInfoResult, TierMetadata, TokenMetadata } from '~/composables/rotki-sponsorship/types';
import { createMetadataCacheKey, createNftTokenCacheKey, createTierCacheKey } from '~/server/features/sponsorship/cache/keys';
import { CACHE_TTL } from '~/server/utils/cache';
import { type CacheService, getCacheService } from '~/server/utils/cache-service';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('nft-cache-manager');

/**
 * NFT Cache Manager - Handles NFT-specific caching patterns and operations
 * Provides high-level caching methods for NFT metadata, tier info, and token data
 * Uses the generic CacheService for actual storage operations
 */
class NftCacheManager {
  constructor(private cacheService: CacheService = getCacheService()) {}

  /**
   * Get cached metadata
   */
  async getMetadata(metadataURI: string): Promise<TierMetadata | null> {
    const cacheKey = createMetadataCacheKey(metadataURI);
    return this.cacheService.getItem<TierMetadata>(cacheKey);
  }

  /**
   * Store metadata in cache
   */
  async setMetadata(metadataURI: string, metadata: TierMetadata): Promise<void> {
    const cacheKey = createMetadataCacheKey(metadataURI);
    await this.cacheService.setItem(cacheKey, metadata, { ttl: CACHE_TTL.METADATA });
    logger.debug(`Cached metadata for: ${metadataURI}`);
  }

  /**
   * Clear metadata cache
   */
  async clearMetadata(metadataURI: string): Promise<void> {
    const cacheKey = createMetadataCacheKey(metadataURI);
    await this.cacheService.removeItem(cacheKey);
    logger.debug(`Cleared metadata cache for: ${metadataURI}`);
  }

  /**
   * Get single tier info from cache
   */
  async getSingleTierInfo(
    tierId: number,
    config: NftConfig,
    releaseId: number,
  ): Promise<TierInfoResult | null> {
    const cacheKey = createTierCacheKey(config.CONTRACT_ADDRESS, releaseId, tierId);
    return this.cacheService.getItem<TierInfoResult>(cacheKey);
  }

  /**
   * Store single tier info in cache
   */
  async setSingleTierInfo(
    tierId: number,
    tierInfo: TierInfoResult,
    config: NftConfig,
    releaseId: number,
  ): Promise<void> {
    const cacheKey = createTierCacheKey(config.CONTRACT_ADDRESS, releaseId, tierId);
    await this.cacheService.setItem(cacheKey, tierInfo, { ttl: CACHE_TTL.TIER_DATA });
    logger.debug(`Stored single tier ${tierId} in cache`);
  }

  /**
   * Get cached tier info for multiple tiers - returns only what's found in cache
   */
  async getCachedTierInfo(
    tierIds: number[],
    config: NftConfig,
    releaseId: number,
  ): Promise<{
    cached: Record<number, TierInfoResult>;
    missing: number[];
  }> {
    const cached: Record<number, TierInfoResult> = {};
    const missing: number[] = [];

    logger.debug(`Checking cache for ${tierIds.length} tiers with release ${releaseId}`);

    for (const tierId of tierIds) {
      const cacheKey = createTierCacheKey(config.CONTRACT_ADDRESS, releaseId, tierId);
      const cachedTier = await this.cacheService.getItem<TierInfoResult>(cacheKey);

      if (cachedTier) {
        cached[tierId] = cachedTier;
        logger.debug(`Cache hit for tier ${tierId}`);
      }
      else {
        missing.push(tierId);
        logger.debug(`Cache miss for tier ${tierId}`);
      }
    }

    logger.debug(`Cache check complete: ${Object.keys(cached).length} found, ${missing.length} missing`);
    return { cached, missing };
  }

  /**
   * Store tier info results in cache
   */
  async storeTierInfo(
    tiers: Record<number, TierInfoResult | undefined>,
    config: NftConfig,
    releaseId: number,
  ): Promise<void> {
    for (const [tierIdStr, tierInfo] of Object.entries(tiers)) {
      if (tierInfo) {
        const tierId = parseInt(tierIdStr, 10);
        const cacheKey = createTierCacheKey(config.CONTRACT_ADDRESS, releaseId, tierId);
        await this.cacheService.setItem(cacheKey, tierInfo, { ttl: CACHE_TTL.TIER_DATA });
        logger.debug(`Stored tier ${tierId} in cache`);
      }
    }
  }

  /**
   * Get cached token data
   */
  async getTokenData(tokenId: number, config: NftConfig): Promise<TokenMetadata | null> {
    const cacheKey = createNftTokenCacheKey(config.CONTRACT_ADDRESS, tokenId);
    return this.cacheService.getItem<TokenMetadata>(cacheKey);
  }

  /**
   * Store token data in cache
   */
  async setTokenData(tokenId: number, tokenData: TokenMetadata, config: NftConfig): Promise<void> {
    const cacheKey = createNftTokenCacheKey(config.CONTRACT_ADDRESS, tokenId);
    await this.cacheService.setItem(cacheKey, tokenData, { ttl: CACHE_TTL.TIER_DATA });
    logger.debug(`Cached token data for: ${tokenId}`);
  }

  /**
   * Clear token data cache
   */
  async clearTokenData(tokenId: number, config: NftConfig): Promise<void> {
    const cacheKey = createNftTokenCacheKey(config.CONTRACT_ADDRESS, tokenId);
    await this.cacheService.removeItem(cacheKey);
    logger.debug(`Cleared cache for token: ${tokenId}`);
  }
}

// Create and export singleton instance
export const nftCacheManager = new NftCacheManager();

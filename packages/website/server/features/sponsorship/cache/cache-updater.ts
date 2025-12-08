import process from 'node:process';
import { SPONSORSHIP_TIERS } from '#shared/features/sponsorship/types';
import { normalizeIpfsUrl } from '#shared/features/sponsorship/utils';
import { useLogger } from '#shared/utils/use-logger';
import { imageCacheManager } from '~~/server/features/sponsorship/cache/managers/image-cache-manager';
import { imageCoreService } from '~~/server/features/sponsorship/images/core';
import { nftCoreService } from '~~/server/features/sponsorship/nft/core';
import { CACHE_TTL } from '~~/server/utils/cache';
import { retryWithBackoff } from '~~/server/utils/retry';

const CACHE_FRESHNESS = {
  IMAGE_STALE_THRESHOLD: 24 * 60 * 60 * 1000, // 24 hours
  NOT_FOUND_STALE_THRESHOLD: 6 * 60 * 60 * 1000, // 6 hours
} as const;

interface CacheUpdateResult {
  images: Record<string, string>;
  supplies: Record<string, { currentSupply: number; maxSupply: number; metadataURI: string }>;
  benefits: Record<string, { benefits: string }>;
  releaseName: string;
  releaseId: number | undefined;
  success: boolean;
  errors: string[];
}

interface CacheUpdateSummary {
  tierCaching: CacheUpdateResult;
  imageCaching: { success: number; failed: number };
}

/**
 * Cache Updater Service - Handles all cache updating operations
 */
class CacheUpdaterService {
  private logger = useLogger('cache-updater-service');

  /** Check if cache updating should be skipped based on environment */
  private shouldSkipCacheUpdate(): { reason?: string; skip: boolean } {
    if (process.env.NODE_ENV === 'prerender' || process.env.NITRO_PRESET === 'nitro-prerender') {
      return { reason: 'build/prerender environment', skip: true };
    }

    const instanceId = process.env.pm_id || process.env.NODE_APP_INSTANCE || '0';
    if (instanceId !== '0') {
      return { reason: `not primary PM2 instance (${instanceId})`, skip: true };
    }

    const { public: { sponsorshipEnabled } } = useRuntimeConfig();
    if (!sponsorshipEnabled) {
      return { reason: 'sponsorship disabled', skip: true };
    }

    return { skip: false };
  }

  /**
   * Update NFT cache by directly calling server functions
   */
  async updateNftCache(): Promise<CacheUpdateResult> {
    const result: CacheUpdateResult = {
      benefits: {},
      errors: [],
      images: {},
      releaseId: undefined,
      releaseName: '',
      success: false,
      supplies: {},
    };

    try {
      const tierIds = SPONSORSHIP_TIERS.map(tier => tier.tierId);

      this.logger.debug(`Fetching all tiers for release for ${tierIds.length} tiers`);
      const { releaseId, tiers } = await nftCoreService.fetchAllTiersForRelease(
        tierIds,
      );

      result.releaseId = releaseId;
      this.logger.info(`Current release ID: ${releaseId}`);

      let successCount = 0;
      const failedTiers: string[] = [];

      for (const tier of SPONSORSHIP_TIERS) {
        const tierInfo = tiers[tier.tierId];

        if (tierInfo) {
          result.images[tier.key] = tierInfo.imageUrl;
          result.supplies[tier.key] = {
            currentSupply: tierInfo.currentSupply,
            maxSupply: tierInfo.maxSupply,
            metadataURI: tierInfo.metadataURI,
          };
          result.benefits[tier.key] = {
            benefits: tierInfo.benefits,
          };

          if (tierInfo.releaseName && !result.releaseName) {
            result.releaseName = tierInfo.releaseName;
          }

          this.logger.debug(`Successfully cached tier: ${tier.key}`);
          successCount++;
        }
        else {
          const errorMsg = `No data returned for tier: ${tier.key} (tierId: ${tier.tierId})`;
          this.logger.warn(errorMsg);
          result.errors.push(errorMsg);
          failedTiers.push(tier.key);
        }
      }

      this.logger.debug(`Tier caching complete: ${successCount}/${SPONSORSHIP_TIERS.length} successful`);

      if (failedTiers.length > 0) {
        this.logger.warn(`Failed tiers: ${failedTiers.join(', ')}`);
      }

      result.success = successCount > 0;
      return result;
    }
    catch (error) {
      const errorMsg = `Cache updating failed: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMsg);
      result.errors.push(errorMsg);
      result.success = false;
      return result;
    }
  }

  /** Check if an image has changed using conditional request with etag */
  private async hasImageChanged(url: string, etag: string): Promise<boolean> {
    try {
      this.logger.debug(`Checking if image changed with etag: ${etag} for ${url}`);

      const response = await retryWithBackoff(async () => fetch(url, {
        headers: {
          'Accept': 'image/*',
          'If-None-Match': etag,
          'User-Agent': 'rotki.com/1.0',
        },
        method: 'HEAD',
        signal: AbortSignal.timeout(10000), // 10 second timeout for HEAD requests
      }), {
        initialDelay: 500,
        maxRetries: 3,
      });

      if (response.status === 304) {
        this.logger.debug(`Image unchanged (304 Not Modified): ${url}`);
        return false; // Image hasn't changed
      }

      if (response.ok) {
        this.logger.debug(`Image changed (${response.status}): ${url}`);
        return true; // Image has changed
      }

      this.logger.warn(`Unexpected status ${response.status} for ${url}, assuming changed`);
      return true;
    }
    catch (error) {
      this.logger.warn(`Error checking etag for ${url}:`, error);
      return true;
    }
  }

  /**
   * Determine if we should perform an etag check based on lastEtagCheck timestamp
   */
  private shouldPerformEtagCheck(metadata: any, dailyThresholdMs: number): boolean {
    if (!metadata.lastEtagCheck) {
      return true;
    }

    const now = Date.now();
    const lastEtagCheckTime = new Date(metadata.lastEtagCheck).getTime();
    const timeSinceLastEtagCheck = now - lastEtagCheckTime;
    const shouldCheck = timeSinceLastEtagCheck >= dailyThresholdMs;

    if (!shouldCheck) {
      const hoursSinceLastCheck = Math.round(timeSinceLastEtagCheck / 1000 / 60 / 60);
      this.logger.debug(`Last etag check was ${hoursSinceLastCheck}h ago, threshold is 24h`);
    }

    return shouldCheck;
  }

  /**
   * Check if an image needs to be updated based on cache age and etag validation
   * Etag checks are throttled to once per day to avoid excessive network requests
   */
  private async needsImageUpdate(url: string): Promise<boolean> {
    try {
      const normalizedUrl = normalizeIpfsUrl(url);
      this.logger.debug(`Checking cache for normalized URL: ${normalizedUrl} (original: ${url})`);

      const metadata = await imageCacheManager.getImageMetadata(normalizedUrl);

      if (!metadata) {
        this.logger.debug(`No cached metadata found for: ${normalizedUrl}`);
        return true;
      }

      const now = Date.now();
      const cachedAt = new Date(metadata.cachedAt).getTime();
      const cacheAge = now - cachedAt;
      const cacheAgeMinutes = Math.round(cacheAge / 1000 / 60);
      const cacheAgeHours = Math.round(cacheAge / 1000 / 60 / 60);

      const redisTtlMs = CACHE_TTL.IMAGE * 1000;
      const refreshThresholdMs = 6 * 60 * 60 * 1000;
      const dailyEtagThresholdMs = 24 * 60 * 60 * 1000;
      const timeToExpiry = redisTtlMs - cacheAge;
      const timeToExpiryHours = Math.round(timeToExpiry / 1000 / 60 / 60);

      this.logger.debug(`Cache age: ${cacheAgeMinutes}min, Redis TTL remaining: ${timeToExpiryHours}h`);

      if (imageCacheManager.is404Response(metadata)) {
        const needsUpdate = cacheAge > CACHE_FRESHNESS.NOT_FOUND_STALE_THRESHOLD;
        this.logger.debug(`404 response, needs update: ${needsUpdate} (threshold: ${CACHE_FRESHNESS.NOT_FOUND_STALE_THRESHOLD / 1000 / 60}min)`);
        return needsUpdate;
      }

      if (timeToExpiry <= refreshThresholdMs) {
        this.logger.debug(`Within 6 hours of Redis expiry (${timeToExpiryHours}h left), triggering refresh without etag check`);
        return true;
      }

      if (cacheAge <= CACHE_FRESHNESS.IMAGE_STALE_THRESHOLD) {
        this.logger.debug(`Image is fresh (age: ${cacheAgeMinutes}min)`);
        return false;
      }
      if (metadata.etag) {
        const shouldPerformCheck = this.shouldPerformEtagCheck(metadata, dailyEtagThresholdMs);

        if (shouldPerformCheck) {
          this.logger.debug(`Cache is stale (${cacheAgeHours}h), performing daily etag check: ${metadata.etag}`);
          const hasChanged = await this.hasImageChanged(normalizedUrl, metadata.etag);

          const updatedMetadata = {
            ...metadata,
            lastEtagCheck: new Date().toISOString(),
          };
          await imageCacheManager.setImageMetadata(normalizedUrl, updatedMetadata);

          if (!hasChanged) {
            this.logger.debug(`Image unchanged per etag, not near Redis expiry (${timeToExpiryHours}h left), skipping refresh`);
            return false;
          }

          this.logger.debug(`Image has changed per etag, triggering refresh`);
          return true;
        }
        else {
          this.logger.debug(`Etag check done recently, skipping etag validation`);
          return false;
        }
      }

      this.logger.debug(`No etag available, assuming changed after ${CACHE_FRESHNESS.IMAGE_STALE_THRESHOLD / 1000 / 60}min`);
      return true;
    }
    catch (error) {
      this.logger.warn(`Error checking cache age for ${url}:`, error);
      return true;
    }
  }

  /**
   * Update image cache by directly caching images
   */
  async updateImageCache(cacheResult: CacheUpdateResult): Promise<{ success: number; failed: number }> {
    this.logger.debug('Starting image cache updating');

    const imageUrls: string[] = [];

    for (const [tierKey, imageUrl] of Object.entries(cacheResult.images)) {
      if (imageUrl) {
        const match = imageUrl.match(/[&?]url=([^&]+)/);
        if (match && match[1]) {
          const actualUrl = decodeURIComponent(match[1]);
          imageUrls.push(actualUrl);
          this.logger.debug(`Found image URL for ${tierKey}: ${actualUrl}`);
        }
        else {
          this.logger.warn(`Could not extract IPFS URL from proxy URL: ${imageUrl}`);
          this.logger.debug(`imageUrl format: ${imageUrl}`);
        }
      }
    }

    if (imageUrls.length === 0) {
      this.logger.warn('No image URLs found to update');
      return { failed: 0, success: 0 };
    }

    const urlsToUpdate: string[] = [];
    const skippedUrls: string[] = [];

    for (const url of imageUrls) {
      if (await this.needsImageUpdate(url)) {
        urlsToUpdate.push(url);
      }
      else {
        skippedUrls.push(url);
      }
    }

    this.logger.info(`Image cache analysis: ${urlsToUpdate.length} need updating, ${skippedUrls.length} are fresh`);

    if (skippedUrls.length > 0) {
      this.logger.debug(`Skipping fresh images: ${skippedUrls.length} URLs`);
    }

    if (urlsToUpdate.length === 0) {
      this.logger.info('All images are up to date, skipping cache refresh');
      return { failed: 0, success: skippedUrls.length };
    }

    this.logger.info(`Caching ${urlsToUpdate.length} stale images`);
    urlsToUpdate.forEach((url, index) => {
      this.logger.debug(`Stale image ${index + 1}: ${url}`);
    });

    const imageResults = await imageCoreService.warmImageCache(urlsToUpdate, {
      maxConcurrency: 3,
    });

    const successful = imageResults.filter(r => r.cached).length;
    const failed = imageResults.filter(r => !r.cached).length;

    if (failed > 0) {
      this.logger.warn(`Image cache updating failed to update ${failed} images`);
    }

    const totalSuccess = successful + skippedUrls.length;

    return { failed, success: totalSuccess };
  }

  /**
   * Perform complete cache update with environment checks
   */
  async performUpdate(): Promise<CacheUpdateSummary & { skipped?: boolean; reason?: string }> {
    const skipCheck = this.shouldSkipCacheUpdate();
    if (skipCheck.skip) {
      this.logger.debug(`Skipping cache update: ${skipCheck.reason}`);
      return {
        imageCaching: { failed: 0, success: 0 },
        reason: skipCheck.reason,
        skipped: true,
        tierCaching: {
          benefits: {},
          errors: [],
          images: {},
          releaseId: undefined,
          releaseName: '',
          success: false,
          supplies: {},
        },
      };
    }

    this.logger.debug('Starting complete cache updating process');

    const tierResult = await this.updateNftCache();

    if (!tierResult.success) {
      this.logger.error('Cache updating failed');
      if (tierResult.errors.length > 0) {
        tierResult.errors.forEach(error => this.logger.error(`${error}`));
      }
      return {
        imageCaching: { failed: 0, success: 0 },
        tierCaching: tierResult,
      };
    }

    const imageResult = await this.updateImageCache(tierResult);

    const cachedTiers = Object.keys(tierResult.supplies).length;
    this.logger.success(`Successfully updated cache for ${cachedTiers} tiers and ${imageResult.success} images`);

    if (imageResult.failed > 0) {
      this.logger.warn(`${imageResult.failed} images failed to cache`);
    }

    return {
      imageCaching: imageResult,
      tierCaching: tierResult,
    };
  }
}

export const cacheUpdaterService = new CacheUpdaterService();

import { SPONSORSHIP_TIERS } from '~/composables/rotki-sponsorship/types';
import { warmImageCache } from '~/server/utils/image-core';
import { fetchCachedSingleTierInfo, getCurrentReleaseId, getNftConfig } from '~/server/utils/nft-core';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('nft-cache-warmer');

export interface CacheWarmingResult {
  images: Record<string, string>;
  supplies: Record<string, { currentSupply: number; maxSupply: number; metadataURI: string }>;
  benefits: Record<string, { benefits: string }>;
  releaseName: string;
  releaseId: number | undefined;
  success: boolean;
  errors: string[];
}

/**
 * Warm NFT cache by directly calling server functions instead of making HTTP requests
 */
export async function warmNftCacheDirect(): Promise<CacheWarmingResult> {
  const result: CacheWarmingResult = {
    benefits: {},
    errors: [],
    images: {},
    releaseId: undefined,
    releaseName: '',
    success: false,
    supplies: {},
  };

  try {
    // Get NFT configuration
    const config = await getNftConfig();

    // Get current release ID
    result.releaseId = await getCurrentReleaseId(config);
    logger.info(`Current release ID: ${result.releaseId}`);

    // Fetch tier data directly using server functions
    const tierPromises = SPONSORSHIP_TIERS.map(async (tier) => {
      try {
        const tierInfo = await fetchCachedSingleTierInfo(tier.tierId, result.releaseId!, config);

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

          logger.info(`Successfully cached tier: ${tier.key}`);
          return { success: true, tier: tier.key, tierInfo };
        }
        else {
          logger.warn(`No data returned for tier: ${tier.key}`);
          return { error: 'No tier data returned', success: false, tier: tier.key };
        }
      }
      catch (error) {
        const errorMsg = `Failed to cache tier ${tier.key}: ${error instanceof Error ? error.message : String(error)}`;
        logger.error(errorMsg);
        result.errors.push(errorMsg);
        return { error: errorMsg, success: false, tier: tier.key };
      }
    });

    const tierResults = await Promise.all(tierPromises);
    const successfulTiers = tierResults.filter(r => r.success);
    const failedTiers = tierResults.filter(r => !r.success);

    logger.info(`Tier caching complete: ${successfulTiers.length}/${SPONSORSHIP_TIERS.length} successful`);

    if (failedTiers.length > 0) {
      logger.warn(`Failed tiers: ${failedTiers.map(t => t.tier).join(', ')}`);
    }

    result.success = successfulTiers.length > 0;

    return result;
  }
  catch (error) {
    const errorMsg = `Cache warming failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMsg);
    result.errors.push(errorMsg);
    result.success = false;
    return result;
  }
}

/**
 * Warm image cache by directly caching images without HTTP requests
 */
export async function warmImageCacheDirect(cacheResult: CacheWarmingResult): Promise<{ success: number; failed: number }> {
  logger.info('Starting image cache warming');

  // Extract image URLs from the cache result
  const imageUrls: string[] = [];

  for (const [tierKey, imageUrl] of Object.entries(cacheResult.images)) {
    if (imageUrl) {
      // Extract the actual IPFS URL from the proxy endpoint
      const match = imageUrl.match(/url=([^&]+)/);
      if (match && match[1]) {
        const actualUrl = decodeURIComponent(match[1]);
        imageUrls.push(actualUrl);
        logger.debug(`Found image URL for ${tierKey}: ${actualUrl}`);
      }
      else {
        logger.warn(`Could not extract IPFS URL from proxy URL: ${imageUrl}`);
      }
    }
  }

  if (imageUrls.length === 0) {
    logger.warn('[Cache Warmer] No image URLs found to warm');
    return { failed: 0, success: 0 };
  }

  // Warm images using the direct caching function
  const imageResults = await warmImageCache(imageUrls, {
    maxConcurrency: 3, // Be gentle on IPFS gateways
    skipCache: false, // Don't skip cache since we want to populate it
  });

  const successful = imageResults.filter(r => r.cached).length;
  const failed = imageResults.filter(r => !r.cached).length;

  logger.info(`Image cache warming complete: ${successful}/${imageUrls.length} successful, ${failed} failed`);

  return { failed, success: successful };
}

/**
 * Complete cache warming process - tiers and images
 */
export async function performCompleteCacheWarming(): Promise<{
  tierCaching: CacheWarmingResult;
  imageCaching: { success: number; failed: number };
}> {
  logger.info('Starting complete cache warming process');

  // First, warm the tier data cache
  const tierResult = await warmNftCacheDirect();

  if (!tierResult.success) {
    logger.error('Tier caching failed, skipping image caching');
    return {
      imageCaching: { failed: 0, success: 0 },
      tierCaching: tierResult,
    };
  }

  logger.success(`Tier caching completed successfully for ${Object.keys(tierResult.supplies).length} tiers`);

  // Then warm the image cache using the results from tier caching
  const imageResult = await warmImageCacheDirect(tierResult);

  logger.success(`Complete cache warming finished: ${Object.keys(tierResult.supplies).length} tiers, ${imageResult.success} images`);

  return {
    imageCaching: imageResult,
    tierCaching: tierResult,
  };
}

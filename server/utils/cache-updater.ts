import { SPONSORSHIP_TIERS } from '~/composables/rotki-sponsorship/types';
import { warmImageCache } from '~/server/utils/image-core';
import { fetchCachedSingleTierInfo, getCurrentReleaseId, getNftConfig } from '~/server/utils/nft-core';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('nft-cache-updater');

export interface CacheUpdateResult {
  images: Record<string, string>;
  supplies: Record<string, { currentSupply: number; maxSupply: number; metadataURI: string }>;
  benefits: Record<string, { benefits: string }>;
  releaseName: string;
  releaseId: number | undefined;
  success: boolean;
  errors: string[];
}

/**
 * Update NFT cache by directly calling server functions instead of making HTTP requests
 */
export async function updateNftCacheDirect(): Promise<CacheUpdateResult> {
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
    // Get NFT configuration
    const config = await getNftConfig();

    // Get current release ID
    result.releaseId = config.RELEASE_ID || await getCurrentReleaseId(config);
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
    const errorMsg = `Cache updating failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMsg);
    result.errors.push(errorMsg);
    result.success = false;
    return result;
  }
}

/**
 * Update image cache by directly caching images without HTTP requests
 */
export async function updateImageCacheDirect(cacheResult: CacheUpdateResult): Promise<{ success: number; failed: number }> {
  logger.info('Starting image cache updating');

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
    logger.warn('[Cache Updater] No image URLs found to update');
    return { failed: 0, success: 0 };
  }

  // Update images using the direct caching function
  const imageResults = await warmImageCache(imageUrls, {
    maxConcurrency: 3, // Be gentle on IPFS gateways
    skipCache: false, // Don't skip cache since we want to populate it
  });

  const successful = imageResults.filter(r => r.cached).length;
  const failed = imageResults.filter(r => !r.cached).length;

  logger.info(`Image cache updating complete: ${successful}/${imageUrls.length} successful, ${failed} failed`);

  return { failed, success: successful };
}

/**
 * Complete cache updating process - tiers and images
 */
export async function performCompleteCacheUpdate(): Promise<{
  tierCaching: CacheUpdateResult;
  imageCaching: { success: number; failed: number };
}> {
  logger.info('Starting complete cache updating process');

  // First, update the tier data cache
  const tierResult = await updateNftCacheDirect();

  if (!tierResult.success) {
    logger.error('Tier caching failed, skipping image caching');
    return {
      imageCaching: { failed: 0, success: 0 },
      tierCaching: tierResult,
    };
  }

  logger.success(`Tier caching completed successfully for ${Object.keys(tierResult.supplies).length} tiers`);

  // Then update the image cache using the results from tier caching
  const imageResult = await updateImageCacheDirect(tierResult);

  logger.success(`Complete cache updating finished: ${Object.keys(tierResult.supplies).length} tiers, ${imageResult.success} images`);

  return {
    imageCaching: imageResult,
    tierCaching: tierResult,
  };
}

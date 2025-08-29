import type { TierInfoResult } from '~/composables/rotki-sponsorship/types';
import { z } from 'zod';
import { handleApiError } from '~/server/utils/errors';
import { clearReleaseIdCache, clearTierInfoCache, fetchCachedSingleTierInfo, fetchTierInfoBatch, getCurrentReleaseId, getNftConfig } from '~/server/utils/nft-core';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('nft-tier-info-api');

// Request validation schema
const querySchema = z.object({
  skipCache: z.string().optional(), // Timestamp for cache busting
  tierIds: z.string().optional().transform((val) => {
    if (!val)
      return [];
    return val.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  }),
});

export default defineEventHandler(async (event) => {
  try {
    // Check if sponsorship feature is enabled
    const { public: { sponsorshipEnabled } } = useRuntimeConfig();
    if (!sponsorshipEnabled) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
      });
    }

    // Validate query parameters
    const query = await getValidatedQuery(event, data => querySchema.parse(data));
    const { skipCache, tierIds } = query;

    // If no specific tier IDs requested, return empty result
    if (!tierIds || tierIds.length === 0) {
      return {
        cached: false,
        releaseId: undefined,
        tiers: {},
      };
    }

    // Get config once at the beginning of the request
    const config = await getNftConfig();

    // Clear release ID cache if cache busting
    if (skipCache) {
      await clearReleaseIdCache(config);
    }

    // Get current release ID (will fetch fresh if cache was cleared)
    const releaseId = await getCurrentReleaseId(config);
    logger.info(`Current release ID: ${releaseId}`);

    // Check if we can use multicall for batch operations
    const useMulticall = tierIds.length > 1;

    let tiers: Record<number, TierInfoResult | undefined> = {};

    if (useMulticall) {
      // Use multicall for batch fetching
      tiers = await fetchTierInfoBatch(tierIds, releaseId, config, !!skipCache);
    }
    else {
      // Single tier fetch
      const tierPromises = tierIds.map(async (tierId) => {
        if (skipCache) {
          // Clear cache when cache busting
          await clearTierInfoCache(tierId, releaseId, config);
        }
        // Always use cached version (will fetch fresh data if cache was cleared)
        const data = await fetchCachedSingleTierInfo(tierId, releaseId, config);
        return { data, tierId };
      });

      const results = await Promise.all(tierPromises);
      for (const { data, tierId } of results) {
        tiers[tierId] = data;
      }
    }

    return {
      releaseId,
      tiers,
    };
  }
  catch (error) {
    handleApiError(event, error);
  }
});

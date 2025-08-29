import type { TokenMetadata } from '~/composables/rotki-sponsorship/types';
import { z } from 'zod';
import { handleApiError } from '~/server/utils/errors';
import { clearTokenDataCache, fetchCachedTokenData, getNftConfig } from '~/server/utils/nft-core';

// Request validation schema
const paramsSchema = z.object({
  'token-id': z.string().transform((val) => {
    const id = parseInt(val, 10);
    if (isNaN(id) || id < 0) {
      throw new Error('Invalid token ID');
    }
    return id;
  }),
});

export default defineEventHandler(async (event): Promise<TokenMetadata> => {
  try {
    // Check if sponsorship feature is enabled
    const { public: { sponsorshipEnabled } } = useRuntimeConfig();
    if (!sponsorshipEnabled) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
      });
    }

    // Validate parameters
    const params = await getValidatedRouterParams(event, data => paramsSchema.parse(data));
    const tokenId = params['token-id'];

    // Get config
    const config = await getNftConfig();

    // Check for cache busting parameter
    const query = getQuery(event);
    const { skipCache } = query;

    if (skipCache) {
      // Clear the cache for this specific token
      await clearTokenDataCache(tokenId, config);
    }

    const tokenData = await fetchCachedTokenData(tokenId, config);

    if (!tokenData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Token not found',
      });
    }

    return tokenData;
  }
  catch (error) {
    handleApiError(event, error);
  }
});

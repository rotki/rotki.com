import type { TokenMetadata } from '~/composables/rotki-sponsorship/types';
import { z } from 'zod';
import { nftCoreService } from '~/server/features/sponsorship/nft/core';
import { handleApiError } from '~/server/utils/errors';

// Request validation schema
const ParametersSchema = z.object({
  'token-id': z.string().transform((val) => {
    const id = parseInt(val, 10);
    if (isNaN(id) || id < 0) {
      throw new Error('Invalid token ID');
    }
    return id;
  }),
});

export default defineEventHandler(async (event): Promise<TokenMetadata> => {
  const { public: { sponsorshipEnabled } } = useRuntimeConfig();
  if (!sponsorshipEnabled) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
    });
  }

  try {
    const { 'token-id': tokenId } = await getValidatedRouterParams(event, data => ParametersSchema.parse(data));

    return await nftCoreService.fetchCachedTokenData(tokenId);
  }
  catch (error) {
    handleApiError(event, error);
  }
});

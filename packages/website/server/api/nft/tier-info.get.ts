import { z } from 'zod';
import { nftCoreService } from '~~/server/features/sponsorship/nft/core';
import { handleApiError } from '~~/server/utils/errors';

// Request validation schema
const QuerySchema = z.object({
  tierIds: z.string().optional().transform((val) => {
    if (!val)
      return [];
    return val.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  }),
});

export default defineEventHandler(async (event) => {
  const { public: { sponsorshipEnabled } } = useRuntimeConfig();
  if (!sponsorshipEnabled) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
    });
  }

  try {
    const { tierIds } = await getValidatedQuery(event, data => QuerySchema.parse(data));

    return await nftCoreService.fetchTiers(tierIds);
  }
  catch (error) {
    handleApiError(event, error);
  }
});

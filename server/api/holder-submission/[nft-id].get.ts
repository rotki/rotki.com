import type { NftSubmission } from '~/types/sponsor';
import { z } from 'zod';
import { handleApiError } from '~/server/utils/errors';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('holder-submission-by-id');

// Request validation schema
const paramsSchema = z.object({
  nftId: z.string().transform(val => parseInt(val, 10)).refine(val => !isNaN(val) && val > 0, {
    message: 'Invalid NFT ID',
  }),
});

export default defineEventHandler(async (event) => {
  try {
    // Validate params
    const params = await getValidatedRouterParams(event, data => paramsSchema.parse(data));
    const { nftId } = params;

    const { public: { baseUrl } } = useRuntimeConfig();

    // Forward request to backend API
    const response = await $fetch<{ submission: NftSubmission | null }>(`${baseUrl}/webapi/nfts/holder-submission/id/${nftId}/`);

    return response;
  }
  catch (error: any) {
    logger.error('Error fetching holder submission by NFT ID:', error);

    // Return null submission if not found
    if (error.statusCode === 404) {
      return { submission: null };
    }

    handleApiError(event, error);
  }
});

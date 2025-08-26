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

    // Get cookies from the incoming request
    const cookies = parseCookies(event);
    const headers: Record<string, string> = {};

    // Forward the siwe cookie if it exists
    if (cookies.siwe) {
      headers.Cookie = `siwe=${cookies.siwe}`;
    }

    // Forward request to backend API with authentication cookie
    const response = await $fetch<{ submission: NftSubmission | null }>(`${baseUrl}/webapi/nfts/holder-submission/id/${nftId}/`, {
      headers,
    });

    return response;
  }
  catch (error: any) {
    logger.error('Error fetching holder submission by NFT ID:', error);

    // Return null submission if not found
    if (error.statusCode === 404) {
      return { submission: null };
    }

    // Handle authentication errors
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required',
      });
    }

    handleApiError(event, error);
  }
});

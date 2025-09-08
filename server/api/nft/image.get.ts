import { z } from 'zod';
import { imageCoreService } from '~/server/features/sponsorship/images/core';
import { handleApiError } from '~/server/utils/errors';

// Request validation schema
const QuerySchema = z.object({
  url: z.string().url().refine(
    url =>
      // Only allow IPFS URLs
      url.startsWith('ipfs://'),
    {
      message: 'Only IPFS URLs are allowed',
    },
  ),
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
    const { url } = await getValidatedQuery(event, data => QuerySchema.parse(data));

    // Check conditional request headers for cached metadata (including cached 404s)
    if (await imageCoreService.handleConditionalRequest(event, url)) {
      return; // 304 response already sent
    }

    // Use the image core service to handle streaming and caching
    await imageCoreService.streamImageWithCache(event, url);
  }
  catch (error) {
    // Set cache headers for error responses to prevent caching errors
    setResponseHeaders(event, {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    });

    // Use enhanced error handling
    handleApiError(event, error);
  }
});

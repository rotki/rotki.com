import { z } from 'zod';
import { handleApiError } from '~/server/utils/errors';
import { handleConditionalRequest } from '~/server/utils/image-cache';
import { getCachedImageMetadata, streamImageWithCacheWrapper } from '~/server/utils/image-core';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('nft-image-proxy');

// Request validation schema
const querySchema = z.object({
  skipCache: z.string().optional(), // Force cache invalidation
  url: z.string().url().refine(
    url =>
      // Only allow IPFS URLs
      url.startsWith('ipfs://') || url.includes('gateway.pinata.cloud/ipfs/'),
    {
      message: 'Only IPFS URLs are allowed',
    },
  ),
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
    const { skipCache, url } = query;

    // Check conditional request headers for cached metadata
    const cachedMetadata = await getCachedImageMetadata(url);

    if (cachedMetadata && handleConditionalRequest(event, cachedMetadata.etag, cachedMetadata.lastModified)) {
      return null; // 304 response already sent
    }

    const shouldSkipCache = !!skipCache;
    logger.debug(`Processing image request: ${url} invalidated: ${shouldSkipCache}`);

    // Use the image core wrapper to handle streaming and caching
    await streamImageWithCacheWrapper(event, url, shouldSkipCache);

    logger.debug(`Successfully processed image: ${url}`);
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

import { z } from 'zod';
import { IPFS_URL } from '~/composables/rotki-sponsorship/constants';
import { CACHE_TTL } from '~/server/utils/cache';
import { createImageCacheKey } from '~/server/utils/cache-keys';
import { getCacheService } from '~/server/utils/cache-service';
import { handleApiError } from '~/server/utils/errors';
import { handleConditionalRequest, invalidateImageCache, streamImageWithCache } from '~/server/utils/image-cache';
import { deduplicatedFetch } from '~/server/utils/request-dedup';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('nft-image-proxy');

// Request validation schema
const querySchema = z.object({
  _invalidate: z.string().optional(), // Force cache invalidation
  url: z.string().url().refine(
    url =>
      // Only allow IPFS URLs
      url.startsWith('ipfs://') || url.includes('gateway.pinata.cloud/ipfs/'),
    {
      message: 'Only IPFS URLs are allowed',
    },
  ),
});

// Convert IPFS URL to HTTP URL
function normalizeIpfsUrl(url: string): string {
  if (url.startsWith('ipfs://')) {
    return `${IPFS_URL}${url.slice(7)}`;
  }
  return url;
}

export default defineEventHandler(async (event) => {
  try {
    // Validate query parameters
    const query = await getValidatedQuery(event, data => querySchema.parse(data));
    const { _invalidate, url } = query;

    // Normalize the URL
    const normalizedUrl = normalizeIpfsUrl(url);

    // Create cache key
    const cacheKey = createImageCacheKey(url);

    // Check for cache invalidation request
    if (_invalidate) {
      await invalidateImageCache(cacheKey);
      logger.info(`Cache invalidated for: ${url}`);
    }

    // Check conditional request headers for cached metadata
    const storage = getCacheService();
    const metadataKey = `${cacheKey}:metadata`;
    const cachedMetadata = await storage.getItem<any>(metadataKey);

    if (cachedMetadata && handleConditionalRequest(event, cachedMetadata.etag, cachedMetadata.lastModified)) {
      return null; // 304 response already sent
    }

    logger.debug(`Processing image request: ${normalizedUrl}`, {
      invalidate: !!_invalidate,
    });

    // Use request deduplication to prevent multiple concurrent fetches
    await deduplicatedFetch(cacheKey, async () => {
      // Stream and cache the image
      await streamImageWithCache(event, normalizedUrl, cacheKey, CACHE_TTL.IMAGE);
      return true;
    });

    logger.debug(`Successfully processed image: ${normalizedUrl}`);
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

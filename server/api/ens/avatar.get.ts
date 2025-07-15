import { z } from 'zod';
import { CACHE_TTL } from '~/server/utils/cache';
import { createImageCacheKey } from '~/server/utils/cache-keys';
import { getCacheService } from '~/server/utils/cache-service';
import { handleApiError } from '~/server/utils/errors';
import { handleConditionalRequest, invalidateImageCache, streamImageWithCache } from '~/server/utils/image-cache';
import { deduplicatedFetch } from '~/server/utils/request-dedup';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('ens-avatar-proxy');

// Request validation schema
const querySchema = z.object({
  _invalidate: z.string().optional(), // Force cache invalidation
  name: z.string().regex(/^[\dA-Za-z-]+\.[\dA-Za-z]+$/, 'Invalid ENS name format'),
  network: z.enum(['mainnet', 'sepolia']).default('mainnet').optional(),
});

export default defineEventHandler(async (event) => {
  try {
    // Validate query parameters
    const query = await getValidatedQuery(event, data => querySchema.parse(data));
    const { _invalidate, name: ensName, network = 'mainnet' } = query;

    // Create cache key using ENS name and network
    const cacheKey = createImageCacheKey(`ens:${network}:${ensName}`);

    // Check for cache invalidation request
    if (_invalidate) {
      await invalidateImageCache(cacheKey);
      logger.info(`Cache invalidated for ENS avatar: ${ensName} on ${network}`);
    }

    // Check conditional request headers for cached metadata
    const storage = getCacheService();
    const metadataKey = `${cacheKey}:metadata`;
    const cachedMetadata = await storage.getItem<any>(metadataKey);

    if (cachedMetadata && handleConditionalRequest(event, cachedMetadata.etag, cachedMetadata.lastModified)) {
      return null; // 304 response already sent
    }

    logger.debug(`Processing ENS avatar request: ${ensName} on ${network}`);

    // Construct ENS metadata URL
    const metadataUrl = `https://metadata.ens.domains/${network}/avatar/${ensName}`;

    // Use request deduplication to prevent multiple concurrent fetches
    await deduplicatedFetch(cacheKey, async () => {
      // Stream and cache the image
      await streamImageWithCache(event, metadataUrl, cacheKey, CACHE_TTL.IMAGE);
      return true;
    });

    logger.debug(`Successfully processed avatar for: ${ensName}`);
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

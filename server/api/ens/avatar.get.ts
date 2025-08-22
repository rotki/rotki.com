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
  name: z.string().regex(/^[\dA-Za-z-]+\.[\dA-Za-z]+$/, 'Invalid ENS name format'),
  network: z.enum(['mainnet', 'sepolia']).default('mainnet').optional(),
  skipCache: z.string().optional(), // Force cache invalidation
});

export default defineEventHandler(async (event) => {
  let ensName: string | undefined;

  try {
    // Validate query parameters
    const query = await getValidatedQuery(event, data => querySchema.parse(data));
    const { name, network = 'mainnet', skipCache } = query;
    ensName = name;

    // Create cache key using ENS name and network
    const cacheKey = createImageCacheKey(`ens:${network}:${ensName}`);

    // Check for cache invalidation request
    if (skipCache) {
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
  catch (error: any) {
    // Set cache headers for error responses to prevent caching errors
    setResponseHeaders(event, {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    });

    // Handle 404 errors specifically (ENS name has no avatar)
    if (error.statusCode === 404 || error.statusMessage?.includes('404')) {
      logger.debug(`No avatar found for ENS name: ${ensName}`);
      throw createError({
        statusCode: 404,
        statusMessage: 'No avatar found for this ENS name',
      });
    }

    // Use enhanced error handling for other errors
    handleApiError(event, error);
  }
});

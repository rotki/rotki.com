import { Buffer } from 'node:buffer';
import { normalizeIpfsUrl } from '~/composables/rotki-sponsorship/utils';
import { CACHE_TTL } from '~/server/utils/cache';
import { createImageCacheKey } from '~/server/utils/cache-keys';
import { getCacheService } from '~/server/utils/cache-service';
import { invalidateImageCache, streamImageWithCache } from '~/server/utils/image-cache';
import { deduplicatedFetch } from '~/server/utils/request-dedup';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('image-core');

export interface ImageCacheResult {
  cached: boolean;
  url: string;
  cacheKey: string;
}

/**
 * Core function to fetch and cache an image without HTTP response handling
 */
export async function fetchAndCacheImage(url: string, skipCache = false): Promise<ImageCacheResult> {
  try {
    // Normalize the URL
    const normalizedUrl = normalizeIpfsUrl(url);

    // Create cache key
    const cacheKey = createImageCacheKey(url);

    // Check for cache invalidation request
    if (skipCache) {
      await invalidateImageCache(cacheKey);
      logger.debug(`Cache invalidated for: ${url}`);
    }

    logger.debug(`Processing image request: ${normalizedUrl}`, {
      invalidate: skipCache,
    });

    // Use request deduplication to prevent multiple concurrent fetches
    await deduplicatedFetch(cacheKey, async () => {
      // Fetch and cache the image directly (without HTTP event)
      await cacheImageDirectly(normalizedUrl, cacheKey);
      return true;
    });

    logger.debug(`Successfully processed image: ${normalizedUrl}`);

    return {
      cached: true,
      cacheKey,
      url: normalizedUrl,
    };
  }
  catch (error) {
    logger.error(`Error fetching/caching image ${url}:`, error);
    throw error;
  }
}

/**
 * Direct image caching without HTTP response streaming
 */
async function cacheImageDirectly(url: string, cacheKey: string): Promise<void> {
  try {
    // Fetch the image
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Image fetch failed: ${response.status} ${response.statusText}`);
    }

    // Get image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');

    // Store in cache
    const storage = getCacheService();

    // Cache the image data
    await storage.setItem(cacheKey, Buffer.from(imageBuffer), {
      ttl: CACHE_TTL.IMAGE,
    });

    // Cache metadata separately
    const metadataKey = `${cacheKey}:metadata`;
    await storage.setItem(metadataKey, {
      cachedAt: new Date().toISOString(),
      contentType,
      etag,
      lastModified,
      size: imageBuffer.byteLength,
    }, {
      ttl: CACHE_TTL.IMAGE,
    });

    logger.debug(`Cached image: ${url} (${imageBuffer.byteLength} bytes)`);
  }
  catch (error) {
    logger.error(`Failed to cache image ${url}:`, error);
    throw error;
  }
}

/**
 * Stream image with caching for HTTP responses (wrapper around existing function)
 */
export async function streamImageWithCacheWrapper(event: any, url: string, skipCache = false): Promise<void> {
  const normalizedUrl = normalizeIpfsUrl(url);
  const cacheKey = createImageCacheKey(url);

  if (skipCache) {
    await invalidateImageCache(cacheKey);
    logger.debug(`Cache invalidated for: ${url}`);
  }

  await deduplicatedFetch(cacheKey, async () => {
    await streamImageWithCache(event, normalizedUrl, cacheKey, CACHE_TTL.IMAGE);
    return true;
  });
}

/**
 * Warm image cache by pre-fetching multiple images
 */
export async function warmImageCache(imageUrls: string[], options: { maxConcurrency?: number; skipCache?: boolean } = {}): Promise<ImageCacheResult[]> {
  const { maxConcurrency = 5, skipCache = false } = options;
  const results: ImageCacheResult[] = [];

  // Process images in batches to avoid overwhelming the system
  for (let i = 0; i < imageUrls.length; i += maxConcurrency) {
    const batch = imageUrls.slice(i, i + maxConcurrency);

    const batchPromises = batch.map(async (url) => {
      try {
        return await fetchAndCacheImage(url, skipCache);
      }
      catch (error) {
        logger.warn(`Failed to cache image ${url}:`, error);
        return {
          cached: false,
          cacheKey: createImageCacheKey(url),
          url,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to be nice to IPFS gateways
    if (i + maxConcurrency < imageUrls.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  logger.debug(`Image cache updating completed: ${results.filter(r => r.cached).length}/${imageUrls.length} successful`);
  return results;
}

/**
 * Check if an image is cached
 */
export async function isImageCached(url: string): Promise<boolean> {
  try {
    const cacheKey = createImageCacheKey(url);
    const storage = getCacheService();
    const cached = await storage.getItem(cacheKey);
    return !!cached;
  }
  catch {
    return false;
  }
}

/**
 * Get cached image metadata
 */
export async function getCachedImageMetadata(url: string): Promise<any> {
  try {
    const cacheKey = createImageCacheKey(url);
    const storage = getCacheService();
    const metadataKey = `${cacheKey}:metadata`;
    return await storage.getItem(metadataKey);
  }
  catch {
    return null;
  }
}

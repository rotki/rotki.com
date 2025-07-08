import { Buffer } from 'node:buffer';
import { z } from 'zod';
import { IPFS_URL } from '~/composables/rotki-sponsorship/constants';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('nft-image-proxy');

// Cache configuration
const IMAGE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 100; // Maximum number of images to cache

// In-memory cache for images
interface ImageCacheEntry {
  data: Buffer;
  contentType: string;
  timestamp: number;
}

class ImageCache {
  private cache = new Map<string, ImageCacheEntry>();
  private accessOrder: string[] = [];

  get(key: string): ImageCacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > IMAGE_CACHE_TTL) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      return null;
    }

    // Update access order (move to end)
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);

    return entry;
  }

  set(key: string, data: Buffer, contentType: string): void {
    // Remove oldest entries if cache is full
    while (this.cache.size >= MAX_CACHE_SIZE && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder.shift()!;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      contentType,
      data,
      timestamp: Date.now(),
    });

    // Add to access order
    this.accessOrder.push(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
}

// Initialize cache
const imageCache = new ImageCache();

// Request validation schema
const querySchema = z.object({
  url: z.string().url().refine(
    url =>
      // Only allow IPFS URLs or our configured IPFS gateway
      url.startsWith('ipfs://') || url.startsWith(IPFS_URL),
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

// Fetch image with proper error handling
async function fetchImage(url: string): Promise<{ data: Buffer; contentType: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'rotki.com/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Validate content type
    if (!contentType.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = Buffer.from(arrayBuffer);

    // Basic size validation (max 10MB)
    if (data.length > 10 * 1024 * 1024) {
      throw new Error('Image too large');
    }

    return { contentType, data };
  }
  catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Validate query parameters
    const query = await getValidatedQuery(event, data => querySchema.parse(data));
    const { url } = query;

    // Normalize IPFS URL
    const normalizedUrl = normalizeIpfsUrl(url);
    const cacheKey = `image:${normalizedUrl}`;

    // Check cache first
    const cached = imageCache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache hit for ${normalizedUrl}`);

      // Set cache headers
      setResponseHeaders(event, {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=172800',
        'Content-Type': cached.contentType,
        'X-Cache': 'HIT',
      });

      return cached.data;
    }

    logger.debug(`Cache miss for ${normalizedUrl}, fetching...`);

    // Fetch image
    const { contentType, data } = await fetchImage(normalizedUrl);

    // Cache the image
    imageCache.set(cacheKey, data, contentType);

    // Set response headers
    setResponseHeaders(event, {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=172800',
      'Content-Type': contentType,
      'X-Cache': 'MISS',
    });

    logger.debug(`Successfully fetched and cached ${normalizedUrl}`);
    return data;
  }
  catch (error) {
    logger.error('Error in image proxy:', error);

    // Return a proper error response
    throw createError({
      statusCode: error instanceof Error && error.message.includes('Invalid content type') ? 400 : 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to fetch image',
    });
  }
});

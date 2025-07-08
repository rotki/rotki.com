import { Buffer } from 'node:buffer';
import { z } from 'zod';
import { IPFS_URL } from '~/composables/rotki-sponsorship/constants';
import { CACHE_TTL } from '~/server/utils/cache';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('nft-image-proxy');

// Cache entry interface for storing image data
interface ImageCacheEntry {
  data: string; // Base64 encoded image data
  contentType: string;
}

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

// Cached function for fetching images
const fetchImageCached = defineCachedFunction(async (url: string): Promise<ImageCacheEntry> => {
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

    return {
      contentType,
      data: data.toString('base64'),
    };
  }
  catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}, {
  getKey: (url: string) => `image:${url}`,
  maxAge: CACHE_TTL.IMAGE,
  name: 'fetchImage',
});

export default defineEventHandler(async (event) => {
  try {
    // Validate query parameters
    const query = await getValidatedQuery(event, data => querySchema.parse(data));
    const { url } = query;

    // Normalize IPFS URL
    const normalizedUrl = normalizeIpfsUrl(url);

    logger.debug(`Fetching image: ${normalizedUrl}`);

    // Fetch image using cached function
    const cached = await fetchImageCached(normalizedUrl);

    // Set response headers
    setResponseHeaders(event, {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=172800',
      'Content-Type': cached.contentType,
    });

    logger.debug(`Successfully served image: ${normalizedUrl}`);

    // Convert base64 back to Buffer
    return Buffer.from(cached.data, 'base64');
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

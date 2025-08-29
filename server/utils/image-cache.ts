import type { H3Event } from 'h3';
import { Buffer } from 'node:buffer';
import { useLogger } from '~/utils/use-logger';
import { CACHE_TTL } from './cache';
import { getCacheService } from './cache-service';
import { retryWithBackoff } from './retry';

const logger = useLogger('image-cache');

// Constants for chunked caching
const CHUNK_SIZE = 64 * 1024; // 64KB chunks as per requirements
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB max

interface ImageMetadata {
  contentType: string;
  contentLength: number;
  etag?: string;
  lastModified?: string;
  totalChunks: number;
}

/**
 * Stream image directly to response while caching in chunks
 */
export async function streamImageWithCache(
  event: H3Event,
  url: string,
  cacheKey: string,
  ttl: number = CACHE_TTL.IMAGE,
): Promise<void> {
  const storage = getCacheService();
  const metadataKey = `${cacheKey}:metadata`;

  // Try to get cached metadata
  const cachedMetadata = await storage.getItem<ImageMetadata>(metadataKey);

  if (cachedMetadata && cachedMetadata.contentLength && cachedMetadata.contentType && cachedMetadata.totalChunks) {
    logger.debug(`Cache hit for ${url}`);

    // Set response headers from cached metadata
    const headers: Record<string, string> = {
      'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`,
      'Content-Length': cachedMetadata.contentLength.toString(),
      'Content-Type': cachedMetadata.contentType,
      'X-Content-Type-Options': 'nosniff',
    };

    if (cachedMetadata.etag) {
      headers.ETag = cachedMetadata.etag;
    }
    if (cachedMetadata.lastModified) {
      headers['Last-Modified'] = cachedMetadata.lastModified;
    }

    setResponseHeaders(event, headers);

    // Stream cached chunks
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (let i = 0; i < cachedMetadata.totalChunks; i++) {
            const chunkKey = `${cacheKey}:chunk:${i}`;
            const chunkData = await storage.getItem<string>(chunkKey);

            if (!chunkData) {
              throw new Error(`Missing chunk ${i} for ${url}`);
            }

            // Convert base64 to buffer and stream
            const buffer = Buffer.from(chunkData, 'base64');
            controller.enqueue(new Uint8Array(buffer));
          }
          controller.close();
        }
        catch (error) {
          logger.error(`Error streaming cached chunks for ${url}:`, error);
          controller.error(error);

          // Invalidate corrupted cache
          await invalidateImageCache(cacheKey);
        }
      },
    });

    return sendStream(event, stream);
  }

  // Cache miss - fetch and cache while streaming
  logger.debug(`Cache miss for ${url}, fetching...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await retryWithBackoff(async () => fetch(url, {
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'rotki.com/1.0',
      },
      signal: controller.signal,
    }), {
      initialDelay: 500,
      maxRetries: 3,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `HTTP ${response.status}: ${response.statusText}`,
      });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = parseInt(response.headers.get('content-length') || '0');
    const etag = response.headers.get('etag') || undefined;
    const lastModified = response.headers.get('last-modified') || undefined;

    // Validate content
    if (!contentType.startsWith('image/')) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid content type: ${contentType}`,
      });
    }

    if (contentLength > MAX_IMAGE_SIZE) {
      throw createError({
        statusCode: 413,
        statusMessage: 'Image too large (max 10MB)',
      });
    }

    // Set response headers
    const headers: Record<string, string> = {
      'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`,
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
    };

    if (contentLength > 0) {
      headers['Content-Length'] = contentLength.toString();
    }
    if (etag) {
      headers.ETag = etag;
    }
    if (lastModified) {
      headers['Last-Modified'] = lastModified;
    }

    setResponseHeaders(event, headers);

    // Stream response while caching chunks
    let chunkIndex = 0;
    let totalSize = 0;
    let buffer = Buffer.alloc(0);

    const transformStream = new TransformStream({
      async flush() {
        // Process any remaining data in buffer
        if (buffer.length > 0) {
          const chunkKey = `${cacheKey}:chunk:${chunkIndex}`;
          await storage.setItem(chunkKey, buffer.toString('base64'), { ttl });
          chunkIndex++;
        }

        // Store metadata after all chunks are cached
        const metadata: ImageMetadata = {
          contentLength: totalSize,
          contentType,
          etag,
          lastModified,
          totalChunks: chunkIndex,
        };

        await storage.setItem(metadataKey, metadata, { ttl });
        logger.debug(`Cached ${chunkIndex} chunks for ${url}, total size: ${totalSize}`);
      },

      async transform(chunk: Uint8Array, controller) {
        // Pass through to response immediately
        controller.enqueue(chunk);

        totalSize += chunk.length;

        // Append to buffer
        buffer = Buffer.concat([buffer, Buffer.from(chunk)]);

        // Process complete chunks
        while (buffer.length >= CHUNK_SIZE) {
          const chunkData = buffer.subarray(0, CHUNK_SIZE);
          const chunkKey = `${cacheKey}:chunk:${chunkIndex}`;

          // Store chunk as base64 string
          await storage.setItem(chunkKey, chunkData.toString('base64'), { ttl });

          buffer = buffer.subarray(CHUNK_SIZE);
          chunkIndex++;
        }
      },
    });

    // Stream through transform
    return await sendStream(event, response.body!.pipeThrough(transformStream));
  }
  catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Invalidate cached image
 */
export async function invalidateImageCache(cacheKey: string): Promise<void> {
  const storage = getCacheService();
  const metadataKey = `${cacheKey}:metadata`;

  // Get metadata to know how many chunks to delete
  const metadata = await storage.getItem<ImageMetadata>(metadataKey);

  if (metadata) {
    // Delete all chunks
    const deletePromises: Promise<void>[] = [];
    for (let i = 0; i < metadata.totalChunks; i++) {
      deletePromises.push(storage.removeItem(`${cacheKey}:chunk:${i}`));
    }

    // Delete metadata
    deletePromises.push(storage.removeItem(metadataKey));

    await Promise.all(deletePromises);
    logger.info(`Invalidated cache for ${cacheKey} (${metadata.totalChunks} chunks)`);
  }
}

/**
 * Check for conditional request headers and return 304 if appropriate
 */
export function handleConditionalRequest(
  event: H3Event,
  etag?: string,
  lastModified?: string,
): boolean {
  const ifNoneMatch = getHeader(event, 'if-none-match');
  const ifModifiedSince = getHeader(event, 'if-modified-since');

  // Check ETag
  if (etag && ifNoneMatch) {
    const normalizedEtag = etag.replace(/^W\//, '');
    const normalizedIfNoneMatch = ifNoneMatch.replace(/^W\//, '');

    if (normalizedEtag === normalizedIfNoneMatch) {
      setResponseStatus(event, 304);
      const headers: Record<string, string> = {
        'Cache-Control': `public, max-age=${CACHE_TTL.IMAGE}, s-maxage=${CACHE_TTL.IMAGE}`,
        'ETag': etag,
      };
      if (lastModified) {
        headers['Last-Modified'] = lastModified;
      }
      setResponseHeaders(event, headers);
      return true;
    }
  }

  // Check Last-Modified
  if (lastModified && ifModifiedSince) {
    try {
      const modifiedDate = new Date(lastModified);
      const ifModifiedDate = new Date(ifModifiedSince);

      if (modifiedDate <= ifModifiedDate) {
        setResponseStatus(event, 304);
        const headers: Record<string, string> = {
          'Cache-Control': `public, max-age=${CACHE_TTL.IMAGE}, s-maxage=${CACHE_TTL.IMAGE}`,
          'Last-Modified': lastModified,
        };
        if (etag) {
          headers.ETag = etag;
        }
        setResponseHeaders(event, headers);
        return true;
      }
    }
    catch {
      // Invalid date, continue with normal response
    }
  }

  return false;
}

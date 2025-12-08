import { useLogger } from '#shared/utils/use-logger';
import { ImageConfig } from '~~/server/features/sponsorship/cache/managers/image-cache-manager';
import { retryWithBackoff } from '~~/server/utils/retry';

const logger = useLogger('image-http-service');

interface ImageResponseHeaders {
  contentLength: number;
  contentType: string;
  etag?: string;
  lastModified?: string;
}

/**
 * Image HTTP Service - Handles HTTP requests for images
 * Provides methods for fetching images with retry logic and proper error handling
 */
class ImageHttpService {
  /**
   * Fetch image with retry logic and validation
   */
  async fetchImageWithRetry(url: string, signal?: AbortSignal): Promise<Response> {
    const response = await retryWithBackoff(async () => fetch(url, {
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'rotki.com/1.0',
      },
      signal,
    }), {
      initialDelay: 500,
      maxRetries: 3,
    });

    if (!response.ok) {
      // For 404s, we want to preserve the response headers before throwing
      if (response.status === 404) {
        const error = createError({
          statusCode: 404,
          statusMessage: `Image not found: ${response.status} ${response.statusText}`,
        });
        // Attach headers for caching purposes
        (error as any).responseHeaders = {
          etag: response.headers.get('etag'),
          lastModified: response.headers.get('last-modified'),
        };
        throw error;
      }

      throw createError({
        statusCode: response.status,
        statusMessage: `Image fetch failed: ${response.status} ${response.statusText}`,
      });
    }

    return response;
  }

  /**
   * Extract headers from fetch response
   */
  extractResponseHeaders(response: Response): ImageResponseHeaders {
    return {
      contentLength: parseInt(response.headers.get('content-length') || '0'),
      contentType: response.headers.get('content-type') || 'application/octet-stream',
      etag: response.headers.get('etag') || undefined,
      lastModified: response.headers.get('last-modified') || undefined,
    };
  }

  /**
   * Fetch image data directly and return buffer with headers
   */
  async fetchImageData(url: string): Promise<{
    buffer: ArrayBuffer;
    headers: ImageResponseHeaders;
  }> {
    logger.debug(`Fetching image data: ${url}`);

    const response = await this.fetchImageWithRetry(url);
    const headers = this.extractResponseHeaders(response);
    const buffer = await response.arrayBuffer();

    logger.debug(`Fetched image data: ${url} (${buffer.byteLength} bytes)`);

    return { buffer, headers };
  }

  /**
   * Create AbortController with timeout
   */
  createTimeoutController(timeoutMs = ImageConfig.TIMEOUT_MS): {
    controller: AbortController;
    timeoutId: NodeJS.Timeout;
  } {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    return { controller, timeoutId };
  }
}

// Create and export singleton instance
export const imageHttpService = new ImageHttpService();

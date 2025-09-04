import type { H3Event } from 'h3';
import { normalizeIpfsUrl } from '~/composables/rotki-sponsorship/utils';
import { createImageCacheKey } from '~/server/features/sponsorship/cache/keys';
import { createImageCacheKeyBranded, createImageUrl, imageCacheManager, ImageConfig, type ImageMetadata } from '~/server/features/sponsorship/cache/managers/image-cache-manager';
import { imageHttpService } from '~/server/features/sponsorship/images/http-service';
import { imageStreamingService } from '~/server/features/sponsorship/images/streaming';
import { CACHE_TTL } from '~/server/utils/cache';
import { deduplicatedFetch } from '~/server/utils/request-dedup';
import { useLogger } from '~/utils/use-logger';

export interface ImageCacheResult {
  cached: boolean;
  url: string;
  cacheKey: string;
}

/**
 * Image Core Service - Handles all image-related operations
 * Provides efficient methods for fetching, caching, and streaming images
 * Uses ImageCacheManager for caching operations and includes comprehensive error handling
 */
export class ImageCoreService {
  private logger = useLogger('image-core');

  /**
   * Fetch and cache an image without HTTP response handling
   */
  async fetchAndCacheImage(url: string): Promise<ImageCacheResult> {
    try {
      // Normalize the URL
      const normalizedUrl = normalizeIpfsUrl(url);
      const cacheKey = createImageCacheKey(url);

      this.logger.debug(`Processing image request: ${normalizedUrl}`);

      // Use request deduplication to prevent multiple concurrent fetches
      await deduplicatedFetch(cacheKey, async () => {
        // Fetch and cache the image directly (without HTTP event)
        await this.cacheImageDirectly(normalizedUrl);
        return true;
      });

      this.logger.debug(`Successfully processed image: ${normalizedUrl}`);

      return {
        cached: true,
        cacheKey: createImageCacheKeyBranded(cacheKey),
        url: createImageUrl(normalizedUrl),
      };
    }
    catch (error) {
      this.logger.error(`Error fetching/caching image ${url}:`, error);
      throw error;
    }
  }

  /**
   * Direct image caching without HTTP response streaming
   */
  private async cacheImageDirectly(url: string): Promise<void> {
    try {
      const { buffer, headers } = await imageHttpService.fetchImageData(url);

      // Validate content
      imageCacheManager.validateImageConstraints(headers.contentType, buffer.byteLength);

      // Store in cache using the manager
      await imageCacheManager.setImageData(url, buffer, {
        contentType: headers.contentType,
        etag: headers.etag,
        lastModified: headers.lastModified,
      });

      this.logger.debug(`Cached image: ${url} (${buffer.byteLength} bytes)`);
    }
    catch (error) {
      this.logger.error(`Failed to cache image ${url}:`, error);
      throw error;
    }
  }

  /**
   * Stream image with caching for HTTP responses
   */
  async streamImageWithCache(event: H3Event, url: string): Promise<void> {
    const normalizedUrl = normalizeIpfsUrl(url);
    const cacheKey = createImageCacheKey(url);

    // Use request deduplication to prevent multiple concurrent fetches
    await deduplicatedFetch(cacheKey, async () => {
      await this.performStreamingWithCache(event, normalizedUrl);
      return true;
    });
  }

  /**
   * Perform actual streaming with chunked caching
   */
  private async performStreamingWithCache(event: H3Event, url: string): Promise<void> {
    // Try to get cached metadata first
    const cachedMetadata = await imageCacheManager.getImageMetadata(url);

    if (cachedMetadata) {
      // Check if this is a cached 404 response
      if (imageCacheManager.is404Response(cachedMetadata)) {
        this.logger.debug(`Cache hit for 404: ${url}`);
        throw createError({
          statusCode: 404,
          statusMessage: 'No avatar found for this ENS name',
        });
      }

      // Regular cached image
      if (cachedMetadata.contentLength && cachedMetadata.contentType && cachedMetadata.totalChunks > 0) {
        this.logger.debug(`Cache hit for ${url}`);
        await this.streamFromCache(event, url, cachedMetadata);
        return;
      }
    }

    // Cache miss - fetch and cache while streaming
    this.logger.debug(`Cache miss for ${url}, fetching...`);
    await this.fetchAndStreamWithCaching(event, url);
  }

  /**
   * Stream image from cache
   */
  private async streamFromCache(event: H3Event, url: string, metadata: ImageMetadata): Promise<void> {
    // Set response headers
    const headers = this.createImageHeaders(
      metadata.contentType,
      metadata.contentLength,
      metadata.etag,
      metadata.lastModified,
    );

    setResponseHeaders(event, headers);

    // Stream cached data (unified chunked approach)
    const stream = imageStreamingService.createCachedImageStream(url, metadata.totalChunks);

    await sendStream(event, stream);
  }

  /**
   * Fetch and stream with caching
   */
  private async fetchAndStreamWithCaching(event: H3Event, url: string): Promise<void> {
    const { controller, timeoutId } = imageHttpService.createTimeoutController();

    try {
      const response = await imageHttpService.fetchImageWithRetry(url, controller.signal);
      clearTimeout(timeoutId);

      const { contentLength, contentType, etag, lastModified } = imageHttpService.extractResponseHeaders(response);

      // Validate content
      imageCacheManager.validateImageConstraints(contentType, contentLength);

      // Set response headers
      this.setImageResponseHeaders(event, contentType, contentLength, etag, lastModified);

      // Stream response while caching
      const transformStream = imageStreamingService.createCachingTransformStream(url, contentType, etag, lastModified);
      await sendStream(event, response.body!.pipeThrough(transformStream));
    }
    catch (error: any) {
      clearTimeout(timeoutId);

      // Handle 404 errors by caching them to avoid future requests
      if (error.statusCode === 404 && error.responseHeaders) {
        this.logger.debug(`Caching 404 response for: ${url}`);
        await imageCacheManager.cache404Response(
          url,
          error.responseHeaders.etag,
          error.responseHeaders.lastModified,
        );
      }

      throw error;
    }
  }

  /**
   * Create image response headers object
   */
  private createImageHeaders(
    contentType?: string,
    contentLength?: number,
    etag?: string,
    lastModified?: string,
    includeStaleWhileRevalidate = true,
  ): Record<string, string> {
    const cacheControl = includeStaleWhileRevalidate
      ? `public, max-age=${CACHE_TTL.IMAGE}, s-maxage=${CACHE_TTL.IMAGE}, stale-while-revalidate=${CACHE_TTL.IMAGE * 2}`
      : `public, max-age=${CACHE_TTL.IMAGE}, s-maxage=${CACHE_TTL.IMAGE}`;

    const headers: Record<string, string> = {
      'Cache-Control': cacheControl,
    };

    if (contentType) {
      headers['Content-Type'] = contentType;
      headers['X-Content-Type-Options'] = 'nosniff';
    }
    if (contentLength && contentLength > 0) {
      headers['Content-Length'] = contentLength.toString();
    }
    if (etag) {
      headers.ETag = etag;
    }
    if (lastModified) {
      headers['Last-Modified'] = lastModified;
    }

    return headers;
  }

  /**
   * Set image response headers
   */
  private setImageResponseHeaders(
    event: H3Event,
    contentType: string,
    contentLength: number,
    etag?: string,
    lastModified?: string,
  ): void {
    const headers = this.createImageHeaders(contentType, contentLength, etag, lastModified);
    setResponseHeaders(event, headers);
  }

  /**
   * Warm image cache by pre-fetching multiple images
   */
  async warmImageCache(imageUrls: string[], options: { maxConcurrency?: number } = {}): Promise<ImageCacheResult[]> {
    const { maxConcurrency = ImageConfig.MAX_CONCURRENCY } = options;
    const results: ImageCacheResult[] = [];

    // Process images in batches to avoid overwhelming the system
    for (let i = 0; i < imageUrls.length; i += maxConcurrency) {
      const batch = imageUrls.slice(i, i + maxConcurrency);

      const batchPromises = batch.map(async (url) => {
        try {
          return await this.fetchAndCacheImage(url);
        }
        catch (error) {
          this.logger.warn(`Failed to cache image ${url}:`, error);
          return {
            cached: false,
            cacheKey: createImageCacheKeyBranded(createImageCacheKey(url)),
            url: createImageUrl(url),
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

    this.logger.debug(`Image cache warming completed: ${results.filter(r => r.cached).length}/${imageUrls.length} successful`);
    return results;
  }

  /**
   * Get cached image metadata
   */
  async getCachedImageMetadata(url: string): Promise<ImageMetadata | null> {
    return imageCacheManager.getImageMetadata(url);
  }

  /**
   * Handle conditional requests for cached images (including cached 404s)
   */
  async handleConditionalRequest(event: H3Event, url: string): Promise<boolean> {
    const cachedMetadata = await imageCacheManager.getImageMetadata(url);

    if (!cachedMetadata) {
      return false;
    }

    const ifNoneMatch = getHeader(event, 'if-none-match');
    const ifModifiedSince = getHeader(event, 'if-modified-since');

    // Check ETag
    if (cachedMetadata.etag && ifNoneMatch) {
      const normalizedEtag = cachedMetadata.etag.replace(/^W\//, '');
      const normalizedIfNoneMatch = ifNoneMatch.replace(/^W\//, '');

      if (normalizedEtag === normalizedIfNoneMatch) {
        setResponseStatus(event, 304);
        const headers = this.createImageHeaders(
          undefined,
          undefined,
          cachedMetadata.etag,
          cachedMetadata.lastModified,
          false,
        );
        setResponseHeaders(event, headers);
        return true;
      }
    }

    // Check Last-Modified
    if (cachedMetadata.lastModified && ifModifiedSince) {
      try {
        const modifiedDate = new Date(cachedMetadata.lastModified);
        const ifModifiedDate = new Date(ifModifiedSince);

        if (modifiedDate <= ifModifiedDate) {
          setResponseStatus(event, 304);
          const headers = this.createImageHeaders(
            undefined,
            undefined,
            cachedMetadata.etag,
            cachedMetadata.lastModified,
            false,
          );
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
}

// Create and export singleton instance
export const imageCoreService = new ImageCoreService();

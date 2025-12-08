import { Buffer } from 'node:buffer';
import { z } from 'zod';
import { createImageCacheKey } from '~/server/features/sponsorship/cache/keys';
import { CACHE_TTL } from '~/server/utils/cache';
import { type CacheService, getCacheService } from '~/server/utils/cache-service';
import { useLogger } from '~/utils/use-logger';

// Branded types for better type safety
type ImageUrl = string & { readonly __brand: 'ImageUrl' };

type ImageCacheKey = string & { readonly __brand: 'ImageCacheKey' };

// Zod schema for supported URL validation
const supportedUrlSchema = z.string()
  .min(1, 'URL cannot be empty')
  .refine(
    url => url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ipfs://'),
    'Only HTTP, HTTPS, and IPFS protocols are supported',
  )
  .refine(
    (url) => {
      // For IPFS URLs, convert to HTTPS for validation
      const testUrl = url.startsWith('ipfs://') ? url.replace('ipfs://', 'https://') : url;
      return z.string().url().safeParse(testUrl).success;
    },
    'Malformed URL structure',
  );

/**
 * Create a branded ImageUrl from a string with validation
 */
export function createImageUrl(url: string): ImageUrl {
  const trimmedUrl = url.trim();

  const result = supportedUrlSchema.safeParse(trimmedUrl);

  if (!result.success) {
    const firstError = result.error.errors[0];
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid URL: ${firstError.message}`,
    });
  }

  return trimmedUrl as ImageUrl;
}

/**
 * Create a branded ImageCacheKey from a string
 */
export function createImageCacheKeyBranded(key: string): ImageCacheKey {
  return key as ImageCacheKey;
}

const logger = useLogger('image-cache-manager');

// Image processing configuration
export const ImageConfig = {
  CACHE_TTL: CACHE_TTL.IMAGE,
  CHUNK_SIZE: 64 * 1024, // 64KB chunks
  MAX_CONCURRENCY: 5,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB max
  SUPPORTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'] as const,
  TIMEOUT_MS: 30000, // 30 seconds
} as const;

export interface ImageMetadata {
  contentType: string;
  contentLength: number;
  etag?: string;
  lastModified?: string;
  totalChunks: number;
  cachedAt: string;
  size: number;
  lastEtagCheck?: string; // When we last performed an etag validation check
}

/**
 * Image Cache Manager - Handles image-specific caching patterns and operations
 * Provides high-level caching methods for image data and metadata
 * Uses the generic CacheService for actual storage operations
 */
export class ImageCacheManager {
  constructor(private cacheService: CacheService = getCacheService()) {}

  /**
   * Get cache key for image URL
   */
  private getCacheKey(url: string): string {
    return createImageCacheKey(url);
  }

  /**
   * Get metadata cache key
   */
  private getMetadataKey(url: string): string {
    return `${this.getCacheKey(url)}:metadata`;
  }

  /**
   * Get chunk cache key
   */
  private getChunkKey(url: string, chunkIndex: number): string {
    return `${this.getCacheKey(url)}:chunk:${chunkIndex}`;
  }

  /**
   * Get cached image metadata
   */
  async getImageMetadata(url: string): Promise<ImageMetadata | null> {
    const metadataKey = this.getMetadataKey(url);
    return this.cacheService.getItem<ImageMetadata>(metadataKey);
  }

  /**
   * Store image metadata in cache
   */
  async setImageMetadata(url: string, metadata: ImageMetadata): Promise<void> {
    const metadataKey = this.getMetadataKey(url);
    await this.cacheService.setItem(metadataKey, metadata, { ttl: ImageConfig.CACHE_TTL });
    logger.debug(`Cached image metadata for: ${url}`);
  }

  /**
   * Get cached image chunk
   */
  async getImageChunk(url: string, chunkIndex: number): Promise<string | null> {
    const chunkKey = this.getChunkKey(url, chunkIndex);
    return this.cacheService.getItem<string>(chunkKey);
  }

  /**
   * Store image chunk in cache
   */
  async setImageChunk(url: string, chunkIndex: number, chunkData: Buffer): Promise<void> {
    const chunkKey = this.getChunkKey(url, chunkIndex);
    await this.cacheService.setItem(chunkKey, chunkData.toString('base64'), { ttl: ImageConfig.CACHE_TTL });
  }

  /**
   * Store complete image data using unified chunked approach
   */
  async setImageData(url: string, imageBuffer: ArrayBuffer, headers: {
    contentType: string;
    etag?: string;
    lastModified?: string;
  }): Promise<void> {
    const buffer = Buffer.from(imageBuffer);

    // Always use chunked storage for consistency
    await this.storeImageAsChunks(url, buffer, headers);
    logger.debug(`Cached image: ${url} (${buffer.length} bytes)`);
  }

  /**
   * Cache a 404 response for the given URL
   */
  async cache404Response(url: string, etag?: string, lastModified?: string): Promise<void> {
    const metadata = this.create404Metadata(etag, lastModified);
    await this.setImageMetadata(url, metadata);
    logger.debug(`Cached 404 response for: ${url}`);
  }

  /**
   * Create image metadata object
   */
  createImageMetadata(
    contentLength: number,
    contentType: string,
    totalChunks: number,
    etag?: string,
    lastModified?: string,
  ): ImageMetadata {
    return {
      cachedAt: new Date().toISOString(),
      contentLength,
      contentType,
      etag,
      lastModified,
      size: contentLength,
      totalChunks,
    };
  }

  /**
   * Create metadata for a cached 404 response
   */
  create404Metadata(etag?: string, lastModified?: string): ImageMetadata {
    return {
      cachedAt: new Date().toISOString(),
      contentLength: 0,
      contentType: 'application/not-found',
      etag,
      lastModified,
      size: 0,
      totalChunks: 0, // 0 chunks indicates a cached 404
    };
  }

  /**
   * Check if metadata represents a cached 404 response
   */
  is404Response(metadata: ImageMetadata): boolean {
    return metadata.totalChunks === 0 && metadata.contentType === 'application/not-found';
  }

  /**
   * Store image data as chunks (unified storage method)
   */
  private async storeImageAsChunks(url: string, imageBuffer: Buffer, headers: {
    contentType: string;
    etag?: string;
    lastModified?: string;
  }): Promise<void> {
    let chunkIndex = 0;

    // Store chunks
    for (let offset = 0; offset < imageBuffer.length; offset += ImageConfig.CHUNK_SIZE) {
      const chunk = imageBuffer.subarray(offset, offset + ImageConfig.CHUNK_SIZE);
      await this.setImageChunk(url, chunkIndex, chunk);
      chunkIndex++;
    }

    // Store metadata using factory method
    const metadata = this.createImageMetadata(
      imageBuffer.length,
      headers.contentType,
      chunkIndex,
      headers.etag,
      headers.lastModified,
    );

    await this.setImageMetadata(url, metadata);
    logger.debug(`Stored image in ${chunkIndex} chunks: ${url} (${imageBuffer.length} bytes)`);
  }

  /**
   * Get all image chunks for streaming
   */
  async* getImageChunks(url: string, totalChunks: number): AsyncGenerator<Buffer, void, unknown> {
    for (let i = 0; i < totalChunks; i++) {
      const chunkData = await this.getImageChunk(url, i);
      if (!chunkData) {
        throw createError({
          statusCode: 404,
          statusMessage: `Missing chunk ${i} for cached image ${url}`,
        });
      }
      yield Buffer.from(chunkData, 'base64');
    }
  }

  /**
   * Invalidate cached image and all its chunks
   */
  async invalidateImage(url: string): Promise<void> {
    const metadata = await this.getImageMetadata(url);

    if (metadata) {
      const deletePromises: Promise<void>[] = [];

      // Delete all chunks (unified approach - everything is chunked now)
      for (let i = 0; i < metadata.totalChunks; i++) {
        deletePromises.push(this.cacheService.removeItem(this.getChunkKey(url, i)));
      }

      // Delete metadata
      deletePromises.push(this.cacheService.removeItem(this.getMetadataKey(url)));

      await Promise.all(deletePromises);
      logger.debug(`Invalidated cache for ${url} (${metadata.totalChunks} chunks)`);
    }
  }

  /**
   * Validate image constraints
   */
  validateImageConstraints(contentType: string, contentLength: number): void {
    if (!contentType.startsWith('image/')) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid content type: ${contentType}`,
      });
    }

    if (contentLength > ImageConfig.MAX_IMAGE_SIZE) {
      throw createError({
        statusCode: 413,
        statusMessage: 'Image too large (max 10MB)',
      });
    }
  }

  /**
   * Get cache constants for external use
   */
  getCacheConstants() {
    return {
      CHUNK_SIZE: ImageConfig.CHUNK_SIZE,
      MAX_IMAGE_SIZE: ImageConfig.MAX_IMAGE_SIZE,
    };
  }
}

// Create and export singleton instance
export const imageCacheManager = new ImageCacheManager();

import { Buffer } from 'node:buffer';
import { imageCacheManager } from '~/server/features/sponsorship/cache/managers/image-cache-manager';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('image-streaming');

/**
 * Image Streaming Utilities - Handles streaming and transform operations for images
 * Provides methods for creating transform streams and readable streams for image data
 */
export class ImageStreamingService {
  /**
   * Create transform stream for caching while streaming
   */
  createCachingTransformStream(
    url: string,
    contentType: string,
    etag?: string,
    lastModified?: string,
  ): TransformStream {
    const { CHUNK_SIZE } = imageCacheManager.getCacheConstants();
    let chunkIndex = 0;
    let totalSize = 0;
    let buffer = Buffer.alloc(0);

    return new TransformStream({
      flush: async () => {
        // Process any remaining data in buffer
        if (buffer.length > 0) {
          await imageCacheManager.setImageChunk(url, chunkIndex, buffer);
          chunkIndex++;
        }

        // Store metadata after all chunks are cached
        const metadata = imageCacheManager.createImageMetadata(
          totalSize,
          contentType,
          chunkIndex,
          etag,
          lastModified,
        );

        await imageCacheManager.setImageMetadata(url, metadata);
        logger.debug(`Cached ${chunkIndex} chunks for ${url}, total size: ${totalSize}`);
      },

      transform: async (chunk: Uint8Array, controller) => {
        // Pass through to response immediately
        controller.enqueue(chunk);

        totalSize += chunk.length;

        // Append to buffer
        buffer = Buffer.concat([buffer, Buffer.from(chunk)]);

        // Process complete chunks
        while (buffer.length >= CHUNK_SIZE) {
          const chunkData = buffer.subarray(0, CHUNK_SIZE);
          await imageCacheManager.setImageChunk(url, chunkIndex, chunkData);

          buffer = buffer.subarray(CHUNK_SIZE);
          chunkIndex++;
        }
      },
    });
  }

  /**
   * Create readable stream from cached image chunks
   */
  createCachedImageStream(url: string, totalChunks: number): ReadableStream {
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of imageCacheManager.getImageChunks(url, totalChunks)) {
            controller.enqueue(new Uint8Array(chunk));
          }
          controller.close();
        }
        catch (error) {
          logger.error(`Error streaming cached chunks for ${url}:`, error);
          controller.error(error);
          // Invalidate corrupted cache data so fresh data can be fetched
          await imageCacheManager.invalidateImage(url);
        }
      },
    });
  }
}

// Create and export singleton instance
export const imageStreamingService = new ImageStreamingService();

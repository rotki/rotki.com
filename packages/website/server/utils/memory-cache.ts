import { useLogger } from '#shared/utils/use-logger';

const logger = useLogger('memory-cache');

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Simple in-memory cache with TTL support.
 * Used as L1 cache to avoid Redis roundtrips on every request.
 * Each instance has its own cache - not shared across workers.
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval> | undefined;

  constructor() {
    // Run cleanup every 5 minutes to remove expired entries (matches typical L1 TTL)
    // Use unref() so this timer doesn't prevent Node.js from exiting during SSR build
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    this.cleanupInterval.unref();
  }

  /**
   * Get a cached value if it exists and hasn't expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      logger.debug(`L1 cache expired: ${key}`);
      return undefined;
    }

    logger.debug(`L1 cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Set a value in the cache with a TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttlMs Time-to-live in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
    logger.debug(`L1 cache set: ${key} (TTL: ${ttlMs}ms)`);
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    logger.debug(`L1 cache deleted: ${key}`);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
    logger.debug('L1 cache cleared');
  }

  /**
   * Remove all expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.debug(`L1 cache cleanup: removed ${expiredCount} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number } {
    return { size: this.cache.size };
  }

  /**
   * Stop the cleanup interval (for testing/shutdown)
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }
}

// Singleton instance
export const memoryCache = new MemoryCache();

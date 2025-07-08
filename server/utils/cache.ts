import type { Storage } from 'unstorage';

/**
 * Get the cache storage instance from Nitro
 */
export function getCacheStorage(): Storage {
  return useStorage('cache');
}

/**
 * Cache TTL configurations in seconds
 */
export const CACHE_TTL = {
  IMAGE: 24 * 60 * 60, // 24 hours
  METADATA: 60 * 60, // 1 hour
  RELEASE_ID: 10 * 60, // 10 minutes
  TIER_DATA: 5 * 60, // 5 minutes
} as const;

/**
 * Generate a cache key with consistent prefix
 */
export function getCacheKey(type: 'image' | 'metadata' | 'releaseId' | 'tier', ...parts: string[]): string {
  return `${type}:${parts.join(':')}`;
}

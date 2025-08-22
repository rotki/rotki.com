/**
 * Cache TTL configurations in seconds
 */
export const CACHE_TTL = {
  CONFIG: 5 * 60, // 5 minutes
  IMAGE: 24 * 60 * 60, // 24 hours
  METADATA: 60 * 60, // 1 hour
  RELEASE_ID: 10 * 60, // 10 minutes
  TIER_DATA: 5 * 60, // 5 minutes
} as const;

/**
 * Cache TTL configurations in seconds
 */
export const CACHE_TTL = {
  CONFIG: 5 * 60, // 5 minutes
  IMAGE: 7 * 24 * 60 * 60, // 7 days
  INTEGRATIONS: 24 * 60 * 60, // 24 hours (data changes monthly)
  METADATA: 60 * 60, // 1 hour
  RELEASE_ID: 10 * 60, // 10 minutes
  TIER_DATA: 5 * 60, // 5 minutes
} as const;

export const TIER_NAMES = {
  FREE: 'starter',
  CUSTOM: 'custom',
} as const;

export type TierName = typeof TIER_NAMES[keyof typeof TIER_NAMES];

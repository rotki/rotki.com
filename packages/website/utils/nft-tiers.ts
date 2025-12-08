interface TierConfig {
  medal: string;
  classes: string;
}

const TIER_CONFIG: Record<string, TierConfig> = {
  bronze: {
    classes: '!bg-orange-700 !text-orange-50',
    medal: '🥉',
  },
  gold: {
    classes: '!bg-yellow-500 !text-yellow-900',
    medal: '🥇',
  },
  silver: {
    classes: '!bg-gray-300 !text-gray-800',
    medal: '🥈',
  },
};

export function getTierMedal(tier: string | undefined): string {
  if (!tier)
    return '';
  return TIER_CONFIG[tier]?.medal || '';
}

export function getTierClasses(tier: string | undefined): string {
  if (!tier)
    return '';
  return TIER_CONFIG[tier]?.classes || '';
}

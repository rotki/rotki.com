import type { PremiumTierInfoDescription } from '~/types/tiers';

export function useFreePlanFeatures(): PremiumTierInfoDescription[] {
  return [
    {
      label: 'Essential features to get started',
      value: true,
    },
    {
      label: 'Historical events limit',
      value: '1K events',
    },
  ];
}

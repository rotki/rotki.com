import type { FeatureValue } from '~/components/pricings/type';

export function useFreePlanFeatures(): Array<{ label: string; value: FeatureValue }> {
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

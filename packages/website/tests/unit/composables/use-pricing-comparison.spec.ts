import type { FeatureDescriptionMap, FeatureValue, PlanBase } from '~/components/pricings/type';
import type { PremiumTiersInfo } from '~/types/tiers';
import { describe, expect, it } from 'vitest';
import { parseTiersInfo, resolveFeatureValue } from '~/composables/use-pricing-comparison';

const CUSTOM_LABELS = { support: 'Bespoke support', negotiable: 'Negotiable' };

function freePlan(): PlanBase {
  return { name: 'starter', displayedName: 'Starter', mainPriceDisplay: 'Free', type: 'free', hidden: false, isMostPopular: false };
}

function customPlan(): PlanBase {
  return { name: 'custom', displayedName: 'Custom', mainPriceDisplay: 'Contact us', type: 'custom', hidden: false, isMostPopular: false };
}

function regularPlan(name = 'pro'): PlanBase {
  return { name, displayedName: 'Pro', mainPriceDisplay: '10€', type: 'regular', hidden: false, isMostPopular: false };
}

describe('parseTiersInfo', () => {
  it('returns empty results for empty input', () => {
    const result = parseTiersInfo([]);

    expect(result.labels).toEqual([]);
    expect(result.descriptions.size).toBe(0);
    expect(result.featureFlags.size).toBe(0);
  });

  it('extracts labels in order from tiers data', () => {
    const tiersData: PremiumTiersInfo = [
      {
        name: 'basic',
        description: [
          { label: 'API Access', value: true },
          { label: 'Support', value: 'Email' },
        ],
        limits: {},
        monthlyPlan: null,
        yearlyPlan: null,
      },
      {
        name: 'pro',
        description: [
          { label: 'API Access', value: true },
          { label: 'Events', value: 1000 },
        ],
        limits: {},
        monthlyPlan: null,
        yearlyPlan: null,
      },
    ];

    const result = parseTiersInfo(tiersData);

    expect(result.labels).toEqual(['API Access', 'Support', 'Events']);
  });

  it('builds the description map correctly', () => {
    const tiersData: PremiumTiersInfo = [
      {
        name: 'pro',
        description: [
          { label: 'Events', value: 5000 },
          { label: 'API Access', value: true },
        ],
        limits: {},
        monthlyPlan: null,
        yearlyPlan: null,
      },
    ];

    const result = parseTiersInfo(tiersData);

    expect(result.descriptions.get('pro')?.get('Events')).toBe(5000);
    expect(result.descriptions.get('pro')?.get('API Access')).toBe(true);
  });

  it('identifies feature flags (all-boolean labels)', () => {
    const tiersData: PremiumTiersInfo = [
      {
        name: 'basic',
        description: [
          { label: 'API Access', value: true },
          { label: 'Events', value: 100 },
        ],
        limits: {},
        monthlyPlan: null,
        yearlyPlan: null,
      },
      {
        name: 'pro',
        description: [
          { label: 'API Access', value: true },
          { label: 'Events', value: 5000 },
        ],
        limits: {},
        monthlyPlan: null,
        yearlyPlan: null,
      },
    ];

    const result = parseTiersInfo(tiersData);

    expect(result.featureFlags.has('API Access')).toBe(true);
    expect(result.featureFlags.has('Events')).toBe(false);
  });

  it('does not flag as boolean when mixed types exist', () => {
    const tiersData: PremiumTiersInfo = [
      {
        name: 'basic',
        description: [{ label: 'Support', value: false }],
        limits: {},
        monthlyPlan: null,
        yearlyPlan: null,
      },
      {
        name: 'pro',
        description: [{ label: 'Support', value: 'Priority' }],
        limits: {},
        monthlyPlan: null,
        yearlyPlan: null,
      },
    ];

    const result = parseTiersInfo(tiersData);

    expect(result.featureFlags.has('Support')).toBe(false);
  });

  it('skips tiers with no description', () => {
    const tiersData = [
      {
        name: 'empty',
        limits: {},
        monthlyPlan: null,
        yearlyPlan: null,
      },
      {
        name: 'basic',
        description: [{ label: 'Events', value: 100 }],
        limits: {},
        monthlyPlan: null,
        yearlyPlan: null,
      },
    ] as PremiumTiersInfo;

    const result = parseTiersInfo(tiersData);

    expect(result.labels).toEqual(['Events']);
    expect(result.descriptions.has('empty')).toBe(false);
    expect(result.descriptions.has('basic')).toBe(true);
  });
});

describe('resolveFeatureValue', () => {
  const emptyDescriptions: FeatureDescriptionMap = new Map();
  const emptyFlags = new Set<string>();
  const emptyFreeFeatures = new Map<string, FeatureValue>();

  describe('free plan', () => {
    it('returns value from free features map when present', () => {
      const freeFeatures = new Map<string, FeatureValue>([
        ['Events', '1K events'],
      ]);

      const result = resolveFeatureValue(
        freePlan(),
        'Events',
        emptyDescriptions,
        emptyFlags,
        freeFeatures,
        CUSTOM_LABELS,
      );

      expect(result).toBe('1K events');
    });

    it('returns false for feature flags not in free features', () => {
      const flags = new Set(['API Access']);

      const result = resolveFeatureValue(
        freePlan(),
        'API Access',
        emptyDescriptions,
        flags,
        emptyFreeFeatures,
        CUSTOM_LABELS,
      );

      expect(result).toBe(false);
    });

    it('returns undefined for non-flag labels not in free features', () => {
      const result = resolveFeatureValue(
        freePlan(),
        'Unknown',
        emptyDescriptions,
        emptyFlags,
        emptyFreeFeatures,
        CUSTOM_LABELS,
      );

      expect(result).toBeUndefined();
    });
  });

  describe('custom plan', () => {
    it('returns true for feature flags', () => {
      const flags = new Set(['API Access']);

      const result = resolveFeatureValue(
        customPlan(),
        'API Access',
        emptyDescriptions,
        flags,
        emptyFreeFeatures,
        CUSTOM_LABELS,
      );

      expect(result).toBe(true);
    });

    it('returns support label for support features', () => {
      const result = resolveFeatureValue(
        customPlan(),
        'Premium Support',
        emptyDescriptions,
        emptyFlags,
        emptyFreeFeatures,
        CUSTOM_LABELS,
      );

      expect(result).toBe('Bespoke support');
    });

    it('returns negotiable label for non-support, non-flag features', () => {
      const result = resolveFeatureValue(
        customPlan(),
        'Events',
        emptyDescriptions,
        emptyFlags,
        emptyFreeFeatures,
        CUSTOM_LABELS,
      );

      expect(result).toBe('Negotiable');
    });
  });

  describe('regular plan', () => {
    it('returns the value from the description map', () => {
      const descriptions: FeatureDescriptionMap = new Map([
        ['pro', new Map([['Events', 5000]])],
      ]);

      const result = resolveFeatureValue(
        regularPlan('pro'),
        'Events',
        descriptions,
        emptyFlags,
        emptyFreeFeatures,
        CUSTOM_LABELS,
      );

      expect(result).toBe(5000);
    });

    it('returns undefined for missing plan in description map', () => {
      const result = resolveFeatureValue(
        regularPlan('pro'),
        'Events',
        emptyDescriptions,
        emptyFlags,
        emptyFreeFeatures,
        CUSTOM_LABELS,
      );

      expect(result).toBeUndefined();
    });

    it('returns undefined for missing label in plan descriptions', () => {
      const descriptions: FeatureDescriptionMap = new Map([
        ['pro', new Map([['Events', 5000]])],
      ]);

      const result = resolveFeatureValue(
        regularPlan('pro'),
        'Missing',
        descriptions,
        emptyFlags,
        emptyFreeFeatures,
        CUSTOM_LABELS,
      );

      expect(result).toBeUndefined();
    });
  });
});

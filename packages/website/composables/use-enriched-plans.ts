import type { AvailablePlan, AvailablePlans } from '@rotki/card-payment-common/schemas/plans';
import type { Ref } from 'vue';
import type { FeatureValue } from '~/components/pricings/type';
import type { PremiumTierInfoDescription, PremiumTiersInfo } from '~/types/tiers';
import { get } from '@vueuse/shared';

interface EnrichedPlan {
  plan: AvailablePlan;
  features: PremiumTierInfoDescription[];
  includesEverythingFrom?: string;
}

interface EnrichedPlanRaw {
  plan: AvailablePlan;
  features: PremiumTierInfoDescription[];
  includesEverythingFromIdentifier?: string;
}

/**
 * Creates a map of features from descriptions
 */
function createFeaturesMap(descriptions: PremiumTierInfoDescription[]): Map<string, FeatureValue> {
  const featuresMap = new Map<string, FeatureValue>();
  descriptions.forEach((desc) => {
    featuresMap.set(desc.label, desc.value);
  });
  return featuresMap;
}

/**
 * Gets new or different features by comparing with previous tier features
 */
function getNewFeatures(
  currentFeatures: PremiumTierInfoDescription[],
  previousFeatures: Map<string, FeatureValue>,
): PremiumTierInfoDescription[] {
  const newFeatures: PremiumTierInfoDescription[] = [];

  currentFeatures.forEach((feature) => {
    const previousValue = previousFeatures.get(feature.label);

    // Include if:
    // 1. Feature doesn't exist in previous tier
    // 2. Feature exists but has a different value
    if (previousValue === undefined || previousValue !== feature.value) {
      newFeatures.push({
        label: feature.label,
        value: feature.value,
      });
    }
  });

  return newFeatures;
}

interface PlanComparison {
  previousFeatures: Map<string, FeatureValue>;
  includesEverythingFromIdentifier: string;
}

/**
 * Gets comparison data for the first paid plan (compares with free plan)
 * Returns 'free' as the identifier for translation
 */
function getFirstPlanComparison(
  freePlanFeatures: PremiumTierInfoDescription[],
): PlanComparison {
  return {
    includesEverythingFromIdentifier: 'free',
    previousFeatures: createFeaturesMap(freePlanFeatures),
  };
}

/**
 * Gets comparison data for subsequent plans (compares with previous paid plan)
 * Returns the previous plan's tierName as the identifier for translation
 */
function getSubsequentPlanComparison(
  previousPlan: AvailablePlan,
  tiers: PremiumTiersInfo,
): PlanComparison {
  const previousTier = tiers.find(tier => tier.name === previousPlan.tierName);
  const previousFeatures = previousTier?.description
    ? createFeaturesMap(previousTier.description)
    : new Map<string, FeatureValue>();

  return {
    includesEverythingFromIdentifier: previousPlan.tierName,
    previousFeatures,
  };
}

/**
 * Enriches a single plan with differential features
 * Returns raw data with identifiers that need to be translated
 */
function enrichPlan(
  plan: AvailablePlan,
  index: number,
  available: AvailablePlans,
  tiers: PremiumTiersInfo,
  freePlanFeatures: PremiumTierInfoDescription[],
): EnrichedPlanRaw {
  const matchingTier = tiers.find(tier => tier.name === plan.tierName);

  if (!matchingTier?.description) {
    return {
      features: [],
      plan,
    };
  }

  const isFirstPlan = index === 0;
  const comparison = isFirstPlan
    ? getFirstPlanComparison(freePlanFeatures)
    : getSubsequentPlanComparison(available[index - 1], tiers);

  const features = getNewFeatures(matchingTier.description, comparison.previousFeatures);

  return {
    features,
    includesEverythingFromIdentifier: comparison.includesEverythingFromIdentifier,
    plan,
  };
}

export function useEnrichedPlans(
  availablePlans: Ref<AvailablePlans>,
  tiersInformation: Ref<PremiumTiersInfo>,
  freePlanFeatures: PremiumTierInfoDescription[],
): ComputedRef<EnrichedPlan[]> {
  const { t } = useI18n();

  /**
   * Translates the identifier to a display string
   * Has access to t via closure
   */
  function translateIdentifier(identifier: string): string {
    if (identifier === 'free') {
      return t('pricing.plans.starter_plan');
    }
    return toTitleCase(t('pricing.plans.plan', { plan: identifier }));
  }

  return computed<EnrichedPlan[]>(() => {
    // Dereference all reactive values upfront
    const available: AvailablePlans = get(availablePlans);
    const tiers: PremiumTiersInfo = get(tiersInformation);

    // Process plans and translate identifiers in a single pass
    return available.map((plan, index): EnrichedPlan => {
      const rawPlan = enrichPlan(plan, index, available, tiers, freePlanFeatures);

      return {
        features: rawPlan.features,
        includesEverythingFrom: rawPlan.includesEverythingFromIdentifier
          ? translateIdentifier(rawPlan.includesEverythingFromIdentifier)
          : undefined,
        plan: rawPlan.plan,
      };
    });
  });
}

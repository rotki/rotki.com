import type { AvailablePlan, AvailablePlans } from '@rotki/card-payment-common/schemas/plans';
import type { Ref } from 'vue';
import type { FeatureValue } from '~/components/pricings/type';
import type { PremiumTiersInfo } from '~/types/tiers';
import { get } from '@vueuse/shared';

interface EnrichedPlan {
  plan: AvailablePlan;
  features: Array<{ label: string; value: FeatureValue }>;
  includesEverythingFrom?: string;
}

export function useEnrichedPlans(
  availablePlans: Ref<AvailablePlans>,
  tiersInformation: Ref<PremiumTiersInfo>,
  freePlanFeatures: Array<{ label: string; value: FeatureValue }>,
) {
  const { t } = useI18n();

  return computed<EnrichedPlan[]>(() => {
    const available = get(availablePlans);
    const tiers = get(tiersInformation);

    return available.map((plan, index) => {
      // Find matching tier by name (not by id, as specified by user)
      const matchingTier = tiers.find(tier => tier.name === plan.tierName);

      const features: Array<{ label: string; value: FeatureValue }> = [];
      let includesEverythingFrom: string | undefined;

      if (matchingTier?.description) {
        // Create a map of previous tier features (free plan for index 0, previous paid plan otherwise)
        const previousFeatures = new Map<string, FeatureValue>();

        if (index === 0) {
          // First paid plan: compare with free plan
          includesEverythingFrom = t('pricing.plans.starter_plan');

          // Add free plan features to comparison
          freePlanFeatures.forEach((feature) => {
            previousFeatures.set(feature.label, feature.value);
          });
        }
        else {
          // Subsequent plans: compare with previous paid plan
          const previousPlan = available[index - 1];
          const previousTier = tiers.find(tier => tier.name === previousPlan.tierName);

          includesEverythingFrom = toTitleCase(t('pricing.plans.plan', { plan: previousPlan.tierName }));

          if (previousTier?.description) {
            previousTier.description.forEach((desc) => {
              previousFeatures.set(desc.label, desc.value);
            });
          }
        }

        // Only add features that are new or different
        matchingTier.description.forEach((desc) => {
          const previousValue = previousFeatures.get(desc.label);

          // Include if:
          // 1. Feature doesn't exist in previous tier
          // 2. Feature exists but has a different value
          if (previousValue === undefined || previousValue !== desc.value) {
            features.push({
              label: desc.label,
              value: desc.value,
            });
          }
        });
      }

      return {
        features,
        includesEverythingFrom,
        plan,
      };
    });
  });
}

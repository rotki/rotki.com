<script setup lang="ts">
import type { FeatureValue, MappedPlan } from '~/components/pricings/type';
import { get } from '@vueuse/core';
import { isCustomPlan, isFreePlan } from '~/components/pricings/utils';
import { type PremiumTiersInfo, PricingPeriod } from '~/types/tiers';

const props = withDefaults(
  defineProps<{
    tiersData?: PremiumTiersInfo;
    selectedPeriod: PricingPeriod;
    compact?: boolean;
  }>(),
  {
    tiersData: () => [],
  },
);

const { t } = useI18n({ useScope: 'global' });

const featuresLabel = computed<string[]>(() => {
  // Aggregate all unique labels from all plans' descriptions
  const labelSet = new Set<string>();

  props.tiersData.forEach((item) => {
    if (item.description) {
      item.description.forEach((desc) => {
        labelSet.add(desc.label);
      });
    }
  });

  return Array.from(labelSet);
});

// Helper function to calculate prices
function calculatePrices(item: any, isYearly: boolean): { monthlyPrice: number; yearlyPrice: number } {
  if (item.yearlyPlan && item.monthlyPlan) {
    const yearlyPrice = parseFloat(item.yearlyPlan.price);
    const monthlyPrice = !isYearly ? parseFloat(item.monthlyPlan.price) : (yearlyPrice / 12);
    return { monthlyPrice, yearlyPrice };
  }
  if (item.yearlyPlan && !item.monthlyPlan) {
    const yearlyPrice = parseFloat(item.yearlyPlan.price);
    return { monthlyPrice: yearlyPrice / 12, yearlyPrice };
  }
  if (item.monthlyPlan && !item.yearlyPlan) {
    const monthlyPrice = parseFloat(item.monthlyPlan.price);
    return { monthlyPrice, yearlyPrice: monthlyPrice * 12 };
  }
  return { monthlyPrice: 0, yearlyPrice: 0 };
}

// Helper function to get feature value for a plan
function getFeatureValue(plan: Omit<MappedPlan, 'features'>, label: string, descriptionMap: Map<string, Map<string, FeatureValue>>): FeatureValue {
  if (isFreePlan(plan))
    return undefined;
  if (isCustomPlan(plan))
    return '';

  const planDescriptions = descriptionMap.get(plan.name);
  return planDescriptions?.get(label) ?? undefined;
}

const plans = computed<MappedPlan[]>(() => {
  const isYearly = props.selectedPeriod === PricingPeriod.YEARLY;

  const regularPlan: Omit<MappedPlan, 'features'>[] = [];
  const descriptionMap = new Map<string, Map<string, FeatureValue>>();

  // Build a map of plan descriptions for feature mapping
  props.tiersData.forEach((item) => {
    if (item.description) {
      const planDescriptions = new Map<string, FeatureValue>();
      item.description.forEach((desc) => {
        planDescriptions.set(desc.label, desc.value);
      });
      descriptionMap.set(item.name, planDescriptions);
    }
  });

  // Process regular plans
  props.tiersData.forEach((item) => {
    // Skip if required plan doesn't exist
    if ((isYearly && !item.yearlyPlan) || (!isYearly && !item.monthlyPlan)) {
      return;
    }

    const { monthlyPrice, yearlyPrice } = calculatePrices(item, isYearly);
    const formattedMonthlyPrice = formatCurrency(monthlyPrice);
    const formattedYearlyPrice = formatCurrency(yearlyPrice);

    regularPlan.push({
      name: item.name,
      displayedName: t('pricing.plans.plan', { plan: toTitleCase(item.name) }),
      mainPriceDisplay: `€ ${formattedMonthlyPrice}`,
      secondaryPriceDisplay: isYearly
        ? t('pricing.billed_annually', { price: formattedYearlyPrice })
        : t('pricing.billed_monthly'),
      type: 'regular',
      isMostPopular: item.isMostPopular,
    });
  });

  const freeTier: Omit<MappedPlan, 'features'> = {
    name: 'starter',
    displayedName: t('pricing.plans.starter_plan'),
    mainPriceDisplay: t('pricing.free'),
    type: 'free',
  };

  const customTier: Omit<MappedPlan, 'features'> = {
    name: 'custom',
    displayedName: t('pricing.plans.custom_plan'),
    mainPriceDisplay: t('pricing.contact_us'),
    type: 'custom',
  };

  // Combine all plans and map features
  const labels = get(featuresLabel);
  const allPlans = [freeTier, ...regularPlan, customTier];

  return allPlans.map(plan => ({
    ...plan,
    features: labels.map(label => getFeatureValue(plan, label, descriptionMap)),
  }));
});

const allowCompact = computed<boolean>(() => props.compact && get(featuresLabel).length > 0);
const compactView = ref<boolean>(get(allowCompact));

const displayedFeaturesLabel = computed<string[]>(() =>
  get(compactView) ? [get(featuresLabel)[0]] : get(featuresLabel),
);

const { isLgAndUp } = useBreakpoint();
</script>

<template>
  <ClientOnly>
    <PricingTable
      v-if="isLgAndUp"
      :plans="plans"
      :compact="compactView"
      :selected-period="selectedPeriod"
      :features-label="displayedFeaturesLabel"
    />
    <PricingTabs
      v-else
      :plans="plans"
      :compact="compactView"
      :selected-period="selectedPeriod"
      :features-label="displayedFeaturesLabel"
    />
    <div class="flex justify-center">
      <RuiButton
        v-if="allowCompact"
        color="primary"
        size="lg"
        @click="compactView = !compactView"
      >
        {{
          compactView
            ? t('pricing.see_all_features')
            : t('pricing.see_less_features')
        }}
      </RuiButton>
    </div>
  </ClientOnly>
</template>

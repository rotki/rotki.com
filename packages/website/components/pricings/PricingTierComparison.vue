<script setup lang="ts">
import type { FeatureDescriptionMap, FeatureValue, MappedPlan, PlanBase, PlanPrices } from '~/components/pricings/type';
import { get, set } from '@vueuse/shared';
import { isCustomPlan, isFreePlan } from '~/components/pricings/utils';
import { type PremiumTierInfo, type PremiumTiersInfo, PricingPeriod } from '~/types/tiers';

const props = withDefaults(defineProps<{
  tiersData?: PremiumTiersInfo;
  selectedPeriod: PricingPeriod;
  compact?: boolean;
}>(), {
  tiersData: () => [],
});

const { t } = useI18n({ useScope: 'global' });
const { isLgAndUp } = useBreakpoint();

const compactView = ref<boolean>(false);
const isYearly = computed<boolean>(() => props.selectedPeriod === PricingPeriod.YEARLY);

const featuresLabel = computed<string[]>(() => {
  const labelSet = new Set<string>();

  props.tiersData.forEach((item) => {
    if (!item.description) {
      return;
    }

    item.description.forEach((desc) => {
      labelSet.add(desc.label);
    });
  });

  return Array.from(labelSet);
});

const descriptionMap = computed<FeatureDescriptionMap>(() => {
  const map: FeatureDescriptionMap = new Map();

  props.tiersData.forEach((item) => {
    if (!item.description) {
      return;
    }

    const planDescriptions = new Map<string, FeatureValue>();
    item.description.forEach((desc) => {
      planDescriptions.set(desc.label, desc.value);
    });
    map.set(item.name, planDescriptions);
  });

  return map;
});

const maxPrice = computed<number>(() => {
  let max = 0;
  const yearly = get(isYearly);

  props.tiersData.forEach((item) => {
    if (!hasPlanForPeriod(item, yearly)) {
      return;
    }

    const { monthlyPrice } = calculatePrices(item, yearly);
    if (monthlyPrice > max) {
      max = monthlyPrice;
    }
  });

  return max;
});

const regularPlans = computed<PlanBase[]>(() => {
  const yearly = get(isYearly);
  const highest = get(maxPrice);
  const plans: PlanBase[] = [];

  props.tiersData.forEach((item) => {
    if (!hasPlanForPeriod(item, yearly)) {
      return;
    }

    const { monthlyPrice, yearlyPrice } = calculatePrices(item, yearly);
    const formattedMonthlyPrice = formatCurrency(monthlyPrice);
    const formattedYearlyPrice = formatCurrency(yearlyPrice);

    plans.push({
      id: yearly ? item.yearlyPlan?.id : item.monthlyPlan?.id,
      name: item.name,
      displayedName: t('pricing.plans.plan', { plan: toTitleCase(item.name) }),
      mainPriceDisplay: `€ ${formattedMonthlyPrice}`,
      secondaryPriceDisplay: yearly
        ? t('pricing.billed_annually', { price: formattedYearlyPrice })
        : t('pricing.billed_monthly'),
      type: 'regular',
      isMostPopular: monthlyPrice === highest,
    });
  });

  return plans;
});

const freeTier = computed<PlanBase>(() => ({
  name: 'starter',
  displayedName: t('pricing.plans.starter_plan'),
  mainPriceDisplay: t('pricing.free'),
  type: 'free',
  isMostPopular: false,
}));

const customTier = computed<PlanBase>(() => ({
  name: 'custom',
  displayedName: t('pricing.plans.custom_plan'),
  mainPriceDisplay: t('pricing.contact_us'),
  type: 'custom',
  isMostPopular: false,
}));

const plans = computed<MappedPlan[]>(() => {
  const labels = get(featuresLabel);
  const descriptions = get(descriptionMap);
  const allPlans = [get(freeTier), ...get(regularPlans), get(customTier)];

  return allPlans.map(plan => ({
    ...plan,
    features: labels.map(label => getFeatureValue(plan, label, descriptions)),
  }));
});

const allowCompact = computed<boolean>(() => props.compact && get(featuresLabel).length > 0);

const displayedFeaturesLabel = computed<string[]>(() =>
  get(compactView) ? [get(featuresLabel)[0]] : get(featuresLabel),
);

function hasPlanForPeriod(plan: PremiumTierInfo, isYearly: boolean): boolean {
  return isYearly ? !!plan.yearlyPlan : !!plan.monthlyPlan;
}

function getPlanPrice(plan: PremiumTierInfo['yearlyPlan'] | PremiumTierInfo['monthlyPlan']): number {
  return plan ? parseFloat(plan.price) : 0;
}

function calculateMonthlyFromYearly(yearlyPrice: number): number {
  return yearlyPrice / 12;
}

function calculateYearlyFromMonthly(monthlyPrice: number): number {
  return monthlyPrice * 12;
}

function calculatePrices(item: PremiumTierInfo, isYearly: boolean): PlanPrices {
  const yearlyPrice = getPlanPrice(item.yearlyPlan);
  const monthlyPrice = getPlanPrice(item.monthlyPlan);

  if (yearlyPrice && monthlyPrice) {
    return {
      monthlyPrice: isYearly ? calculateMonthlyFromYearly(yearlyPrice) : monthlyPrice,
      yearlyPrice,
    };
  }

  if (yearlyPrice) {
    return {
      monthlyPrice: calculateMonthlyFromYearly(yearlyPrice),
      yearlyPrice,
    };
  }

  if (monthlyPrice) {
    return {
      monthlyPrice,
      yearlyPrice: calculateYearlyFromMonthly(monthlyPrice),
    };
  }

  return { monthlyPrice: 0, yearlyPrice: 0 };
}

function isFeatureFlag(label: string, descriptionMap: FeatureDescriptionMap): boolean {
  for (const [_planName, features] of descriptionMap) {
    const featureValue = features.get(label);
    if (typeof featureValue === 'boolean') {
      return true;
    }
  }
  return false;
}

function getFeatureValue(plan: PlanBase, label: string, descriptionMap: FeatureDescriptionMap): FeatureValue {
  if (isFreePlan(plan)) {
    if (label === 'Historical events limit') {
      return '1K events';
    }
    return undefined;
  }

  if (isCustomPlan(plan)) {
    if (label.toLowerCase().includes('support')) {
      return t('pricing.custom_plan_bespoke_support');
    }

    if (isFeatureFlag(label, descriptionMap)) {
      return true;
    }

    return t('pricing.custom_plan_negotiable');
  }

  return descriptionMap.get(plan.name)?.get(label);
}

watch(allowCompact, (value) => {
  set(compactView, value);
}, { immediate: true });
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

<script setup lang="ts">
import type { CustomPlan, MappedPlan, RegularPlan, StarterPlan } from '~/components/pricings/type';
import { get } from '@vueuse/core';
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

const { t } = useI18n();

const popularPlan = 'advanced';

const plans = computed<MappedPlan[]>(() => {
  const isYearly = props.selectedPeriod === PricingPeriod.YEARLY;

  const regularPlan: Omit<RegularPlan, 'features'>[] = props.tiersData.map((item) => {
    const yearlyPrice = parseFloat(item.oneYearTierConfig.basePrice);
    const monthlyPrice = !isYearly ? parseFloat(item.oneMonthTierConfig.basePrice) : (yearlyPrice / 12);

    // Format prices to remove trailing zeros
    const formattedMonthlyPrice = monthlyPrice.toFixed(2);
    const formattedYearlyPrice = yearlyPrice.toFixed(2);

    return {
      name: item.name,
      displayedName: t('pricing.plans.plan', { plan: toTitleCase(item.name) }),
      mainPriceDisplay: `€ ${formattedMonthlyPrice}`,
      secondaryPriceDisplay: isYearly ? t('pricing.billed_annually', { price: formattedYearlyPrice }) : t('pricing.billed_monthly'),
      isMostPopular: item.name === popularPlan,
    };
  });

  const freeTier: Omit<StarterPlan, 'features'> = {
    name: 'starter',
    displayedName: t('pricing.plans.starter_plan'),
    mainPriceDisplay: t('pricing.free'),
    isStarter: true,
  };

  const customTier: Omit<CustomPlan, 'features'> = {
    name: 'custom',
    displayedName: t('pricing.plans.custom_plan'),
    isCustom: true,
  };

  return [
    freeTier,
    ...regularPlan,
    customTier,
  ].map(item => ({
    ...item,
    features: [
      [
        true,
        'Something',
        'Something',
        true,
        false,
        false,
      ],
      [
        true,
        'Something',
        'Something',
        true,
        false,
        false,
      ],
    ],
  }));
});

const featuresLabel = [
  {
    title: 'Overview',
    children: [
      'Basic Features',
      'Something',
      'Something',
      'Something',
    ],
  },
  {
    title: 'Overview',
    children: [
      'Basic Features',
      'Something',
      'Something',
      'Something',
    ],
  },
];

const allowCompact = computed(() => props.compact && featuresLabel.length > 0);
const compactView = ref(get(allowCompact));

const displayedFeaturesLabel = computed(() => {
  if (get(compactView)) {
    return [featuresLabel[0]];
  }
  return featuresLabel;
});

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

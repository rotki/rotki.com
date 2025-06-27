<script setup lang="ts">
import type { MappedPlan } from '~/components/pricings/type';
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

const { t } = useI18n({ useScope: 'global' });

const mostPopularPlan = 'next'; // TODO: get this information from backend

const plans = computed<MappedPlan[]>(() => {
  const isYearly = props.selectedPeriod === PricingPeriod.YEARLY;

  const regularPlan: Omit<MappedPlan, 'features'>[] = [];

  props.tiersData
    .forEach((item) => {
      // Skip if yearly plan is needed but doesn't exist
      if (isYearly && !item.yearlyPlan)
        return;
      // Skip if monthly plan is needed but doesn't exist
      if (!isYearly && !item.monthlyPlan)
        return;

      let yearlyPrice = 0;
      let monthlyPrice = 0;

      if (item.yearlyPlan && item.monthlyPlan) {
        yearlyPrice = parseFloat(item.yearlyPlan.price);
        monthlyPrice = !isYearly ? parseFloat(item.monthlyPlan.price) : (yearlyPrice / 12);
      }
      else if (item.yearlyPlan && !item.monthlyPlan) {
        yearlyPrice = parseFloat(item.yearlyPlan.price);
        monthlyPrice = yearlyPrice / 12;
      }
      else if (item.monthlyPlan && !item.yearlyPlan) {
        monthlyPrice = parseFloat(item.monthlyPlan.price);
        yearlyPrice = monthlyPrice * 12;
      }

      // Format prices to remove trailing zeros
      const formattedMonthlyPrice = monthlyPrice.toFixed(2);
      const formattedYearlyPrice = yearlyPrice.toFixed(2);

      regularPlan.push({
        name: item.name,
        displayedName: t('pricing.plans.plan', { plan: toTitleCase(item.name) }),
        mainPriceDisplay: `€ ${formattedMonthlyPrice}`,
        secondaryPriceDisplay: isYearly ? t('pricing.billed_annually', { price: formattedYearlyPrice }) : t('pricing.billed_monthly'),
        type: 'regular',
        isMostPopular: item.name === mostPopularPlan,
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

// TODO: get this information from backend
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

<script setup lang="ts">
import type { AvailablePlan } from '@rotki/card-payment-common/schemas/plans';
import type { RouteLocationRaw } from 'vue-router';
import { get } from '@vueuse/shared';
import PricingFeatureItem from '~/components/pricings/PricingFeatureItem.vue';
import { type PremiumTierInfoDescription, PricingPeriod } from '~/types/tiers';
import { calculateYearlyDiscount, type DiscountInfo } from '~/utils/pricing';
import { formatCurrency, toTitleCase } from '~/utils/text';

interface CtaConfig {
  label: string;
  link: string | RouteLocationRaw;
  variant: 'outlined' | 'default';
}

const props = withDefaults(defineProps<{
  plan?: AvailablePlan;
  period: PricingPeriod;
  type: 'free' | 'custom' | 'regular';
  features?: PremiumTierInfoDescription[];
  includesEverythingFrom?: string;
}>(), {
  features: () => [],
});

// Route/link constants
const ROUTES = {
  DOWNLOAD: '/download',
  CHECKOUT: 'checkout-pay-method',
} as const;

const { t } = useI18n({ useScope: 'global' });
const {
  public: {
    contact: { emailMailto },
  },
} = useRuntimeConfig();

const { referralCode } = useReferralCodeParam();

const { plan, period, type } = toRefs(props);

const planType = computed<string>(() => get(type));
const currentPlan = computed<AvailablePlan | undefined>(() => get(plan));
const isYearly = computed<boolean>(() => get(period) === PricingPeriod.YEARLY);

// Type guard helpers
const isRegularPlan = computed<boolean>(() => get(planType) === 'regular');
const isFreePlan = computed<boolean>(() => get(planType) === 'free');
const isCustomPlan = computed<boolean>(() => get(planType) === 'custom');

const price = computed<string | undefined>(() => {
  const plan = get(currentPlan);
  if (!get(isRegularPlan) || !plan) {
    return undefined;
  }

  const { monthlyPlan, yearlyPlan } = plan;
  const periodVal = get(period);

  const targetPlan = periodVal === PricingPeriod.YEARLY ? yearlyPlan : monthlyPlan;
  if (!targetPlan)
    return undefined;
  return formatCurrency(Number.parseFloat(targetPlan.price));
});

const discountInfo = computed<DiscountInfo | undefined>(() => {
  const plan = get(currentPlan);
  if (!get(isRegularPlan) || !plan) {
    return undefined;
  }

  const { monthlyPlan, yearlyPlan } = plan;
  const periodVal = get(period);

  // Only calculate discount for yearly plans
  if (periodVal !== PricingPeriod.YEARLY || !monthlyPlan || !yearlyPlan) {
    return undefined;
  }

  return calculateYearlyDiscount(monthlyPlan.price, yearlyPlan.price);
});

const displayedFeatures = computed<Array<{ label: string; value: string }>>(() => {
  const features = get(props.features);
  return features
    .filter((feature) => {
      const { value } = feature;
      // Show if value is truthy and not false
      if (typeof value === 'boolean')
        return value;
      return !!value;
    })
    .map(feature => ({
      label: feature.label,
      value: typeof feature.value === 'boolean' ? '' : String(feature.value),
    }));
});

const isMostPopular = computed<boolean>(() => {
  const plan = get(currentPlan);
  if (!get(isRegularPlan) || !plan) {
    return false;
  }
  return plan.isMostPopular || false;
});

const planName = computed<string>(() => {
  if (get(isFreePlan)) {
    return t('pricing.plans.starter_plan');
  }
  if (get(isCustomPlan)) {
    return t('pricing.plans.custom_plan');
  }
  const plan = get(currentPlan);
  if (plan) {
    return t('pricing.plans.plan', { plan: toTitleCase(plan.tierName) });
  }
  return '';
});

const mainPriceDisplay = computed<string>(() => {
  if (get(isFreePlan)) {
    return t('pricing.free');
  }
  if (get(isCustomPlan)) {
    return t('pricing.contact_us');
  }
  return get(price) ? `${get(price)}€` : '';
});

const secondaryPriceDisplay = computed<string | undefined>(() => {
  if (!get(isRegularPlan) || !get(price)) {
    return undefined;
  }

  const discount = get(discountInfo);
  const yearly = get(isYearly);

  if (yearly && discount) {
    return `${discount.monthlyPrice}€/${t('pricing.per_month')}`;
  }

  return yearly
    ? t('pricing.billed_annually', { price: get(price) })
    : t('pricing.billed_monthly');
});

const savingsDisplay = computed<string | undefined>(() => {
  if (!get(isRegularPlan) || !get(isYearly)) {
    return undefined;
  }

  const discount = get(discountInfo);
  if (!discount) {
    return undefined;
  }

  return t('home.plans.saving', { months: discount.freeMonths });
});

// CTA configuration mapping
const ctaConfig = computed<CtaConfig>(() => {
  const plan = get(currentPlan);

  if (get(isFreePlan)) {
    return {
      label: t('actions.start_now_for_free'),
      link: ROUTES.DOWNLOAD,
      variant: 'outlined' as const,
    };
  }

  if (get(isCustomPlan)) {
    return {
      label: t('values.contact_section.title'),
      link: emailMailto,
      variant: 'default' as const,
    };
  }

  if (get(isRegularPlan) && plan) {
    const periodVal = get(period);
    const isMonthly = periodVal === PricingPeriod.MONTHLY;
    const planId = isMonthly ? plan.monthlyPlan?.planId : plan.yearlyPlan?.planId;
    const ref = get(referralCode);

    const query: Record<string, string | number> = { planId: planId ?? '' };
    if (ref) {
      query.ref = ref;
    }

    return {
      label: t('actions.get_plan', { plan: toTitleCase(plan.tierName) }),
      link: planId
        ? {
            name: ROUTES.CHECKOUT,
            query,
          }
        : '',
      variant: 'default' as const,
    };
  }

  return {
    label: t('actions.get_started'),
    link: '',
    variant: 'default' as const,
  };
});
</script>

<template>
  <div
    class="h-full flex flex-col rounded-xl lg:rounded-t-none"
    :class="{ 'bg-rui-primary': isMostPopular }"
  >
    <div
      v-if="isMostPopular"
      class="bg-rui-primary text-white text-sm py-1.5 font-medium text-center rounded-t-xl lg:-mt-8"
    >
      {{ t('pricing.most_popular_plan') }}
    </div>
    <div
      class="rounded-xl flex flex-col w-full min-w-0 h-full p-4 xl:p-5 border border-solid bg-white border-black/[0.12] relative"
      :class="{
        'border-2 border-rui-primary': isMostPopular,
      }"
    >
      <div class="flex items-center h-0 justify-center relative w-full" />

      <div class="w-full flex justify-between items-start mb-4 gap-2">
        <div class="text-h6 text-rui-primary !leading-6 whitespace-nowrap">
          {{ planName }}
        </div>
        <RuiChip
          v-if="discountInfo"
          size="sm"
          class="!bg-green-400 font-bold text-xs shrink-0"
        >
          {{ discountInfo.discount }}% OFF
        </RuiChip>
      </div>

      <div class="flex items-baseline gap-2 mb-2">
        <div class="text-h5 2xl:text-h4 font-bold">
          {{ mainPriceDisplay }}
        </div>
        <div
          v-if="discountInfo"
          class="text-sm 2xl:text-base text-rui-text-secondary line-through font-normal opacity-70"
        >
          {{ discountInfo.originalPrice }}€
        </div>
      </div>

      <div class="text-sm text-rui-text-secondary mb-6 font-normal lg:min-h-10">
        <div v-if="type === 'custom'">
          {{ t('pricing.custom_plan_info') }}
        </div>
        <template v-else-if="secondaryPriceDisplay">
          <div>{{ secondaryPriceDisplay }}</div>
          <div
            v-if="savingsDisplay"
            class="text-red-400 font-medium"
          >
            {{ savingsDisplay }}
          </div>
        </template>
      </div>

      <ButtonLink
        class="w-full mt-auto py-2 xl:text-[1rem]"
        :to="ctaConfig.link"
        color="primary"
        :variant="ctaConfig.variant"
      >
        {{ ctaConfig.label }}
      </ButtonLink>

      <div
        v-if="includesEverythingFrom || displayedFeatures.length > 0"
        class="flex flex-col gap-2 flex-1 mt-6"
      >
        <PricingFeatureItem v-if="includesEverythingFrom">
          {{ t('pricing.everything_from', { plan: includesEverythingFrom }) }}
        </PricingFeatureItem>

        <PricingFeatureItem
          v-for="(feature, index) in displayedFeatures"
          :key="index"
        >
          <template v-if="feature.value">
            <strong>{{ feature.label }}</strong>: {{ feature.value }}
          </template>
          <template v-else>
            {{ feature.label }}
          </template>
        </PricingFeatureItem>
      </div>
    </div>
  </div>
</template>

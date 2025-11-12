<script setup lang="ts">
import type { AvailablePlan } from '@rotki/card-payment-common/schemas/plans';
import type { FeatureValue } from '~/components/pricings/type';
import { get } from '@vueuse/shared';
import { PricingPeriod } from '~/types/tiers';
import { formatCurrency, toTitleCase } from '~/utils/text';

const props = withDefaults(defineProps<{
  plan?: AvailablePlan;
  period: PricingPeriod;
  type: 'free' | 'custom' | 'regular';
  features?: Array<{ label: string; value: FeatureValue }>;
  includesEverythingFrom?: string;
}>(), {
  features: () => [],
});

const { t } = useI18n({ useScope: 'global' });
const {
  public: {
    contact: { emailMailto },
  },
} = useRuntimeConfig();

const { plan, period, type } = toRefs(props);

const planType = computed(() => get(type));
const currentPlan = computed(() => get(plan));
const isYearly = computed<boolean>(() => get(period) === PricingPeriod.YEARLY);

const price = computed<string | undefined>(() => {
  const plan = get(currentPlan);
  if (get(planType) !== 'regular' || !plan) {
    return undefined;
  }

  const { monthlyPlan, yearlyPlan } = plan;
  const periodVal = get(period);

  const targetPlan = periodVal === PricingPeriod.YEARLY ? yearlyPlan : monthlyPlan;
  if (!targetPlan)
    return undefined;
  return formatCurrency(Number.parseFloat(targetPlan.price));
});

const discountInfo = computed<{
  discount: number;
  freeMonths: number;
  originalPrice: string;
  monthlyPrice: string;
} | undefined>(() => {
  const plan = get(currentPlan);
  if (get(planType) !== 'regular' || !plan) {
    return undefined;
  }

  const { monthlyPlan, yearlyPlan } = plan;
  const periodVal = get(period);

  // Only calculate discount for yearly plans
  if (periodVal !== PricingPeriod.YEARLY || !monthlyPlan || !yearlyPlan)
    return undefined;

  const monthlyPrice = Number.parseFloat(monthlyPlan.price);
  const yearlyPrice = Number.parseFloat(yearlyPlan.price);
  const monthlyTotal = monthlyPrice * 12;
  const savings = monthlyTotal - yearlyPrice;

  if (savings <= 0)
    return undefined;

  const discountPercentage = Math.round((savings / monthlyTotal) * 100);
  const freeMonths = Math.round(savings / monthlyPrice);

  return {
    discount: discountPercentage,
    freeMonths,
    monthlyPrice: formatCurrency(yearlyPrice / 12),
    originalPrice: formatCurrency(monthlyTotal),
  };
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
  if (get(planType) !== 'regular' || !plan) {
    return false;
  }
  return plan.isMostPopular || false;
});

const planName = computed<string>(() => {
  const type = get(planType);
  if (type === 'free') {
    return t('pricing.plans.starter_plan');
  }
  if (type === 'custom') {
    return t('pricing.plans.custom_plan');
  }
  const plan = get(currentPlan);
  if (plan) {
    return t('pricing.plans.plan', { plan: toTitleCase(plan.tierName) });
  }
  return '';
});

const mainPriceDisplay = computed<string>(() => {
  const type = get(planType);
  if (type === 'free') {
    return t('pricing.free');
  }
  if (type === 'custom') {
    return t('pricing.contact_us');
  }
  return get(price) ? `€ ${get(price)}` : '';
});

const secondaryPriceDisplay = computed<string | undefined>(() => {
  if (get(planType) !== 'regular' || !get(price)) {
    return undefined;
  }

  const discount = get(discountInfo);
  const yearly = get(isYearly);

  if (yearly && discount) {
    return `€ ${discount.monthlyPrice}/${t('pricing.per_month')}`;
  }

  return yearly
    ? t('pricing.billed_annually', { price: get(price) })
    : t('pricing.billed_monthly');
});

const savingsDisplay = computed<string | undefined>(() => {
  if (get(planType) !== 'regular' || !get(isYearly)) {
    return undefined;
  }

  const discount = get(discountInfo);
  if (!discount) {
    return undefined;
  }

  return t('home.plans.saving', { months: discount.freeMonths });
});

// CTA configuration mapping
const ctaConfig = computed(() => {
  const type = get(planType);
  const plan = get(currentPlan);

  if (type === 'free') {
    return {
      label: t('actions.start_now_for_free'),
      link: '/download',
      variant: 'outlined' as const,
    };
  }

  if (type === 'custom') {
    return {
      label: t('values.contact_section.title'),
      link: emailMailto,
      variant: 'default' as const,
    };
  }

  if (type === 'regular' && plan) {
    const periodVal = get(period);
    const isMonthly = periodVal === PricingPeriod.MONTHLY;
    const planId = isMonthly ? plan.monthlyPlan?.planId : plan.yearlyPlan?.planId;

    return {
      label: t('actions.get_plan', { plan: toTitleCase(plan.tierName) }),
      link: planId
        ? {
            name: 'checkout-pay-method',
            query: { planId },
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

const ctaLink = computed(() => get(ctaConfig).link);
const ctaLabel = computed(() => get(ctaConfig).label);
const ctaVariant = computed(() => get(ctaConfig).variant);
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
        <div class="text-h6 text-rui-primary !leading-6">
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
        :to="ctaLink"
        color="primary"
        :variant="ctaVariant"
      >
        {{ ctaLabel }}
      </ButtonLink>

      <div
        v-if="includesEverythingFrom || displayedFeatures.length > 0"
        class="flex flex-col gap-2 flex-1 mt-6"
      >
        <div
          v-if="includesEverythingFrom"
          class="flex gap-2 items-start text-sm"
        >
          <RuiIcon
            class="text-rui-primary shrink-0 mt-0.5"
            name="lu-circle-check"
            size="16"
          />
          <span class="text-rui-text">
            {{ t('pricing.everything_from', { plan: includesEverythingFrom }) }}
          </span>
        </div>
        <div
          v-for="(feature, index) in displayedFeatures"
          :key="index"
          class="flex gap-2 items-start text-sm"
        >
          <RuiIcon
            class="text-rui-primary shrink-0 mt-0.5"
            name="lu-circle-check"
            size="16"
          />
          <span class="text-rui-text">
            <template v-if="feature.value">
              <strong>{{ feature.label }}</strong>: {{ feature.value }}
            </template>
            <template v-else>
              {{ feature.label }}
            </template>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

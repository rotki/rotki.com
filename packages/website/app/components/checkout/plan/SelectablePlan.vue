<script lang="ts" setup>
import type { AvailablePlan } from '@rotki/card-payment-common/schemas/plans';
import { get, set } from '@vueuse/core';
import { type PremiumTierInfoDescription, type PremiumTiersInfo, PricingPeriod } from '~/types/tiers';
import { formatCurrency, toTitleCase } from '~/utils/text';

const props = withDefaults(defineProps<{
  plan: AvailablePlan;
  tiersInfo: PremiumTiersInfo;
  selected?: boolean;
  period: PricingPeriod;
  readonly?: boolean;
  disabled?: boolean;
  current?: boolean;
}>(), {
  selected: false,
});

const emit = defineEmits<{
  click: [];
  clear: [];
}>();

const MAX_VISIBLE_FEATURES = 3;

const { t } = useI18n({ useScope: 'global' });

const { plan, tiersInfo, period, selected, current } = toRefs(props);

const showAllFeatures = ref<boolean>(false);

const isDisabled = computed<boolean>(() => props.disabled || get(current));

const price = computed<string | undefined>(() => {
  const { monthlyPlan, yearlyPlan } = get(plan);
  const periodVal = get(period);

  const targetPlan = periodVal === PricingPeriod.YEARLY ? yearlyPlan : monthlyPlan;
  if (!targetPlan)
    return undefined;
  return formatCurrency(parseFloat(targetPlan.price));
});

const discountInfo = computed<{
  discount: number;
  freeMonths: number;
  originalPrice: string;
  monthlyPrice: string;
} | undefined>(() => {
  const { monthlyPlan, yearlyPlan } = get(plan);
  const periodVal = get(period);

  // Only calculate discount for yearly plans
  if (periodVal !== PricingPeriod.YEARLY || !monthlyPlan || !yearlyPlan)
    return undefined;

  const monthlyPrice = parseFloat(monthlyPlan.price);
  const yearlyPrice = parseFloat(yearlyPlan.price);
  const monthlyTotal = monthlyPrice * 12;
  const savings = monthlyTotal - yearlyPrice;

  if (savings <= 0)
    return undefined;

  const discountPercentage = Math.round((savings / monthlyTotal) * 100);
  const freeMonths = Math.round(savings / monthlyPrice);

  return {
    discount: discountPercentage,
    freeMonths,
    originalPrice: formatCurrency(monthlyTotal),
    monthlyPrice: formatCurrency(yearlyPrice / 12),
  };
});

const planFeatures = computed<PremiumTierInfoDescription[]>(() => {
  const tiers = get(tiersInfo);
  const tierInfo = tiers.find(tier => tier.name === props.plan.tierName);
  return tierInfo?.description ?? [];
});

const visibleFeatures = computed<PremiumTierInfoDescription[]>(() => {
  const features = get(planFeatures);
  if (get(showAllFeatures)) {
    return features;
  }
  return features.slice(0, MAX_VISIBLE_FEATURES);
});

const hasMoreFeatures = computed<boolean>(() => get(planFeatures).length > MAX_VISIBLE_FEATURES);

function toggleFeatures(event: MouseEvent): void {
  event.stopPropagation();
  set(showAllFeatures, !get(showAllFeatures));
}

watch(price, (price) => {
  if (!price && get(selected)) {
    emit('clear');
  }
});
</script>

<template>
  <div
    v-if="price"
    class="rounded-md flex flex-col min-w-[14.5rem] xl:min-w-[13rem] 2xl:min-w-[13.5rem] w-full h-full px-6 py-6 border border-solid rounded-lg bg-white border-black/[0.12] relative"
    :class="{
      'cursor-pointer hover:bg-rui-primary/[0.01]': !isDisabled,
      '!border-rui-primary': selected && !isDisabled,
      '!bg-rui-grey-100': isDisabled,
      '!border-rui-primary/50': current,
    }"
    @click="!isDisabled && emit('click')"
  >
    <div class="flex items-center h-0 justify-center relative w-full">
      <RuiChip
        v-if="current"
        class="-top-[2.25rem] absolute"
        color="primary"
        variant="outlined"
        size="sm"
      >
        {{ t('pricing.current_plan') }}
      </RuiChip>
      <RuiChip
        v-else-if="plan.isMostPopular"
        class="-top-[2.25rem] absolute"
        color="primary"
        size="sm"
      >
        {{ t('pricing.most_popular_plan') }}
      </RuiChip>
    </div>

    <div class="w-full flex justify-between items-center mb-4">
      <div class="text-h5 text-rui-text">
        {{ t('pricing.plans.plan', { plan: toTitleCase(plan.tierName) }) }}
      </div>
      <RuiChip
        v-if="discountInfo"
        size="sm"
        class="!bg-green-400 font-bold text-xs"
      >
        {{ discountInfo.discount }}% OFF
      </RuiChip>
    </div>

    <div class="flex items-baseline gap-2">
      <div class="font-bold text-[2.5rem] leading-none text-rui-text">
        {{ price }}€
      </div>
      <div
        v-if="discountInfo"
        class="text-base text-rui-text-secondary line-through font-normal opacity-70"
      >
        {{ discountInfo.originalPrice }}€
      </div>
    </div>

    <div class="text-sm text-rui-text-secondary mt-2 mb-4 font-normal min-h-[1.25rem]">
      <div v-if="discountInfo">
        {{ discountInfo.monthlyPrice }}€/{{ t('pricing.per_month') }} ({{ t('home.plans.saving', { months: discountInfo.freeMonths }) }})
      </div>
    </div>

    <div
      v-if="visibleFeatures.length > 0"
      class="mb-4 pb-4 border-b border-black/[0.08]"
    >
      <ul class="space-y-2">
        <li
          v-for="feature in visibleFeatures"
          :key="feature.label"
          class="flex items-center gap-2 text-sm text-rui-text-secondary"
        >
          <span class="flex-1">{{ feature.label }}</span>
          <RuiIcon
            v-if="typeof feature.value === 'boolean' && feature.value"
            name="lu-circle-check"
            size="16"
            color="success"
          />
          <RuiIcon
            v-else-if="typeof feature.value === 'boolean' && !feature.value"
            name="lu-minus"
            size="16"
            class="text-rui-text-disabled"
          />
          <span
            v-else
            class="font-medium text-rui-primary"
          >
            {{ feature.value }}
          </span>
        </li>
      </ul>
      <button
        v-if="hasMoreFeatures"
        type="button"
        class="mt-3 text-sm text-rui-primary hover:underline font-medium"
        @click="toggleFeatures($event)"
      >
        {{ showAllFeatures ? t('pricing.see_less_features') : t('pricing.see_all_features') }}
      </button>
    </div>

    <RuiButton
      :color="selected || current ? 'primary' : undefined"
      :variant="current ? 'outlined' : undefined"
      class="w-full"
      :disabled="isDisabled"
    >
      <template
        v-if="selected"
        #prepend
      >
        <div class="rounded-full size-4 bg-white flex items-center justify-center">
          <RuiIcon
            name="lu-check"
            color="primary"
            size="12"
          />
        </div>
      </template>
      <template
        v-else-if="current"
        #prepend
      >
        <RuiIcon
          name="lu-check"
          size="16"
        />
      </template>
      {{ current ? t('pricing.current_plan') : selected ? t('home.plans.plan_selected') : t('home.plans.choose') }}
    </RuiButton>
  </div>
</template>

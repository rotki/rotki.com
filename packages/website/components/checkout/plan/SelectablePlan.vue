<script lang="ts" setup>
import type { AvailablePlan } from '@rotki/card-payment-common/schemas/plans';
import { get } from '@vueuse/core';
import { PricingPeriod } from '~/types/tiers';
import { formatCurrency, toTitleCase } from '~/utils/text';

const props = withDefaults(defineProps<{
  plan: AvailablePlan;
  selected?: boolean;
  period: PricingPeriod;
  readonly?: boolean;
  disabled?: boolean;
}>(), {
  selected: false,
});

const emit = defineEmits<{
  click: [];
  clear: [];
}>();

const { t } = useI18n({ useScope: 'global' });

const { plan, period, selected } = toRefs(props);

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

watch(price, (price) => {
  if (!price && get(selected)) {
    emit('clear');
  }
});
</script>

<template>
  <div
    v-if="price"
    class="flex flex-col min-w-[14.5rem] xl:min-w-[13rem] 2xl:min-w-[13.5rem] w-full h-full px-6 py-8 border border-solid rounded-lg cursor-pointer bg-white hover:bg-rui-primary/[0.01] border-black/[0.12] relative"
    :class="{
      '!border-rui-primary': selected,
      '!bg-rui-grey-100': disabled,
    }"
    @click="emit('click')"
  >
    <div class="flex items-center h-0 justify-center relative w-full">
      <RuiChip
        v-if="plan.isMostPopular"
        class="-top-[2.9rem] absolute"
        color="primary"
        size="sm"
      >
        {{ t('pricing.most_popular_plan') }}
      </RuiChip>
    </div>

    <div class="w-full flex justify-start items-center my-1 h-8">
      <RuiChip
        v-if="discountInfo"
        size="sm"
        class="!bg-green-400 font-bold text-xs"
      >
        {{ discountInfo.discount }}% OFF
      </RuiChip>
    </div>

    <div class="text-h5 text-rui-text mb-6">
      {{ t('pricing.plans.plan', { plan: toTitleCase(plan.tierName) }) }}
    </div>

    <div
      v-if="discountInfo"
      class="text-base text-rui-text-secondary line-through font-normal opacity-70 h-6 flex items-center justify-center mb-1"
    >
      {{ discountInfo.originalPrice }}€
    </div>
    <div
      v-else
      class="h-7"
    />

    <div class="font-black text-[2.5rem] leading-none text-rui-text">
      {{ price }}€
    </div>

    <div class="text-sm text-rui-text-secondary mt-3 mb-6 font-normal flex flex-col items-center justify-start h-[2.75rem]">
      <div v-if="discountInfo">
        {{ discountInfo.monthlyPrice }}€/{{ t('home.plans.per_month') }}
      </div>
      <div
        v-if="discountInfo"
        class="text-xs"
      >
        {{ t('home.plans.saving', { months: discountInfo.freeMonths }) }}
      </div>
    </div>

    <RuiButton
      :color="selected ? 'primary' : undefined"
      class="w-full"
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
      {{ selected ? t('home.plans.plan_selected') : t('home.plans.choose') }}
    </RuiButton>
  </div>
</template>

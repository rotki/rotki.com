<script lang="ts" setup>
import type { AvailablePlan } from '~/types';
import { get } from '@vueuse/core';
import { PricingPeriod } from '~/types/tiers';
import { formatCurrency } from '~/utils/text';

const props = withDefaults(
  defineProps<{
    plan: AvailablePlan;
    isMostPopular?: boolean;
    selected?: boolean;
    period: PricingPeriod;
    readonly?: boolean;
    disabled?: boolean;
  }>(),
  {
    selected: false,
    isMostPopular: false,
  },
);

const emit = defineEmits<{
  click: [];
  clear: [];
}>();

const { t } = useI18n({ useScope: 'global' });

const { plan, period, selected, isMostPopular } = toRefs(props);

const price = computed<string | undefined>(() => {
  const { monthlyPlan, yearlyPlan } = get(plan);
  const periodVal = get(period);

  const targetPlan = periodVal === PricingPeriod.YEARLY ? yearlyPlan : monthlyPlan;
  if (!targetPlan)
    return undefined;
  return formatCurrency(parseFloat(targetPlan.price));
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
    class="rounded-xl border border-default p-4 cursor-pointer"
    :class="{
      '!border-rui-primary': selected,
      '!bg-rui-grey-100': disabled,
    }"
    @click="emit('click')"
  >
    <RuiChip
      v-if="isMostPopular"
      color="primary"
      class="mb-2 !min-h-4"
      :class="{
        'opacity-50': disabled,
      }"
    >
      {{ t('pricing.most_popular_plan') }}
    </RuiChip>
    <div class="flex items-center">
      <div class="flex-1">
        <div
          class="text-h6 text-rui-primary"
          :class="{
            'text-rui-text-secondary': disabled,
          }"
        >
          {{ t('pricing.plans.plan', { plan: toTitleCase(plan.tierName) }) }}
        </div>
        <div
          class="flex flex-wrap items-end gap-x-1"
          :class="{
            'text-black/[0.3]': disabled,
          }"
        >
          <div class="text-h5 font-bold">
            € {{ price }}
          </div>
          <div class="text-lg font-medium">
            {{ period === PricingPeriod.YEARLY ? t('pricing.per_year') : t('pricing.per_month') }}
          </div>
        </div>
      </div>
      <CheckMark
        v-if="!readonly"
        :selected="selected"
      />
    </div>
  </div>
</template>

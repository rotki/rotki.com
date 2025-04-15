<script lang="ts" setup>
import type { AvailablePlan } from '~/types';
import { get } from '@vueuse/core';
import { PricingPeriod } from '~/types/tiers';

const props = withDefaults(
  defineProps<{
    plan: AvailablePlan;
    selected?: boolean;
    period: PricingPeriod;
    readonly?: boolean;
    disabled?: boolean;
  }>(),
  {
    selected: false,
  },
);

const emit = defineEmits<{ (e: 'click'): void }>();

const { t } = useI18n({ useScope: 'global' });

const { plan, period } = toRefs(props);

const isMostPopular = computed(() => get(plan).name === 'next');

const price = computed(() => {
  const { oneMonthTierConfig, oneYearTierConfig } = get(plan);
  const periodVal = get(period);

  return parseFloat(periodVal === PricingPeriod.YEARLY ? oneYearTierConfig.basePrice : oneMonthTierConfig.basePrice).toFixed(2);
});
</script>

<template>
  <div
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
          {{ t('pricing.plans.plan', { plan: toTitleCase(plan.name) }) }}
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

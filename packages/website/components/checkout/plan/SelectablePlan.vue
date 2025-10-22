<script lang="ts" setup>
import type { Plan } from '~/types';
import { get } from '@vueuse/core';
import { getPlanSelectionName } from '~/utils/plans';

interface PlanWithDiscount extends Plan {
  freeMonths?: number;
  paidMonths?: number;
  originalPrice?: string;
  originalMonthlyPrice?: string;
}

const props = withDefaults(defineProps<{
  plan: PlanWithDiscount;
  selected: boolean;
  popular?: boolean;
}>(), {
  popular: false,
});

const emit = defineEmits<{ click: [] }>();

const { t } = useI18n({ useScope: 'global' });

const { plan } = toRefs(props);

const name = computed<string>(() => getPlanSelectionName(get(plan).months));

const totalPrice = computed<string>(() => get(plan).priceFiat);

const price = computed<string>(() => {
  const { months, priceFiat } = get(plan);
  return (parseFloat(priceFiat) / months).toFixed(2);
});

function click() {
  emit('click');
}
</script>

<template>
  <div
    class="min-w-[14.5rem] xl:min-w-[13rem] 2xl:min-w-[13.5rem] w-full h-full px-6 py-6 border border-solid rounded-lg cursor-pointer bg-white hover:bg-rui-primary/[0.01] border-black/[0.12] relative"
    :class="{ 'border-rui-primary': selected }"
    @click="click()"
  >
    <div class="flex justify-between items-start w-full h-12">
      <RuiChip
        v-if="popular"
        color="primary"
        size="sm"
        content-class="text-xs"
      >
        {{ t('home.plans.most_popular') }}
      </RuiChip>
      <RuiChip
        v-if="plan.discount"
        size="sm"
        class="!bg-green-400 font-bold text-xs"
      >
        {{ plan.discount }}% OFF
      </RuiChip>
    </div>

    <div class="text-h5 text-rui-text mb-3">
      {{ name }}
    </div>

    <div
      v-if="plan.originalPrice"
      class="text-base text-rui-text-secondary line-through font-normal opacity-70 h-6 mb-1"
    >
      {{ plan.originalPrice }}€
    </div>
    <div
      v-else
      class="h-7"
    />

    <div class="font-black text-[2.5rem] leading-none text-rui-text">
      {{ totalPrice }}€
    </div>

    <div class="text-sm text-rui-text-secondary mt-3 mb-4 font-normal flex flex-col justify-start h-[2.75rem]">
      <div>{{ price }}€/{{ t('home.plans.per_month') }}</div>
      <div
        v-if="plan.freeMonths"
        class="text-xs text-red-600"
      >
        {{ t('home.plans.saving', { months: plan.freeMonths }) }}
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

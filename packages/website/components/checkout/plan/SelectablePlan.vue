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
    class="flex flex-col items-center min-w-[14.5rem] xl:min-w-[13rem] 2xl:min-w-[13.5rem] w-full h-full px-6 py-8 border border-solid rounded-lg cursor-pointer bg-white hover:bg-rui-primary/[0.01] border-black/[0.12] relative"
    :class="{ 'border-rui-primary': selected }"
    @click="click()"
  >
    <div class="flex items-center h-0 justify-center relative w-full">
      <RuiChip
        v-if="popular"
        class="-top-[2.9rem] absolute"
        color="primary"
        size="sm"
      >
        {{ t('home.plans.most_popular') }}
      </RuiChip>
    </div>

    <div class="w-full flex justify-between items-center my-1 h-8">
      <div class="h-full flex items-center">
        <div
          v-if="plan.discount"
          class="px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wider bg-green-400 text-black rounded-full whitespace-nowrap"
        >
          {{ plan.discount }}% OFF
        </div>
      </div>
      <CheckMark :selected="selected" />
    </div>
    <div class="text-h5 text-rui-text mb-6">
      {{ name }}
    </div>

    <div
      v-if="plan.originalPrice"
      class="text-base text-rui-text-secondary line-through font-normal opacity-70 h-6 flex items-center justify-center mb-1"
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

    <div class="text-sm text-rui-text-secondary mt-3 mb-6 font-normal flex flex-col items-center justify-start h-[2.75rem]">
      <div>{{ price }}€/{{ t('home.plans.per_month') }}</div>
      <div
        v-if="plan.freeMonths"
        class="text-xs"
      >
        {{ t('home.plans.saving', { months: plan.freeMonths }) }}
      </div>
    </div>
    <RuiButton
      :color="selected ? 'primary' : undefined"
      class="w-full"
    >
      {{ t('home.plans.choose') }}
    </RuiButton>
  </div>
</template>

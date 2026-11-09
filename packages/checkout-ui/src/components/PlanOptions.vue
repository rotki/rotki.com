<script setup lang="ts">
import type { AvailablePlan, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { formatEur } from '@rotki/card-payment-common/utils/money';
import { formatPlanName } from '@rotki/card-payment-common/utils/plan';
import { computed, ref } from 'vue';
import { useCheckoutMessages } from '../composables/checkout-messages';

type Period = 'monthly' | 'yearly';

interface PlanOption {
  planId: number;
  name: string;
  label: string;
  price: string;
  value: SelectedPlan;
}

const { plans, currentPlanId } = defineProps<{
  plans: AvailablePlan[];
  currentPlanId: number;
}>();

const emit = defineEmits<{
  select: [plan: SelectedPlan];
}>();

const t = useCheckoutMessages();

const period = ref<Period>(plans.some(plan => plan.yearlyPlan?.planId === currentPlanId) ? 'yearly' : 'monthly');

const periods: { value: Period; label: string }[] = [
  { value: 'monthly', label: t('checkout.change_plan.monthly') },
  { value: 'yearly', label: t('checkout.change_plan.yearly') },
];

const options = computed<PlanOption[]>(() => {
  const yearly = period.value === 'yearly';
  const list: PlanOption[] = [];
  for (const plan of plans) {
    const priced = yearly ? plan.yearlyPlan : plan.monthlyPlan;
    if (!priced)
      continue;
    list.push({
      planId: priced.planId,
      name: plan.tierName,
      label: formatPlanName(plan.tierName),
      price: t(yearly ? 'checkout.change_plan.per_year' : 'checkout.change_plan.per_month', { amount: formatEur(priced.price) }),
      value: {
        planId: priced.planId,
        name: plan.tierName,
        price: Number.parseFloat(priced.price),
        durationInMonths: yearly ? 12 : 1,
      },
    });
  }
  return list;
});
</script>

<template>
  <div
    class="flex flex-col gap-4"
    data-cy="plan-options"
  >
    <div
      role="group"
      :aria-label="t('checkout.change_plan.period')"
      class="grid grid-cols-2 gap-1 p-1 rounded-rui-control bg-rui-grey-100"
    >
      <button
        v-for="item in periods"
        :key="item.value"
        type="button"
        class="px-3 py-2 rounded-rui-control text-sm font-medium transition-colors"
        :class="period === item.value ? 'bg-rui-surface text-rui-text shadow-sm' : 'text-rui-text-secondary'"
        :aria-pressed="period === item.value"
        :data-cy="`plan-period-${item.value}`"
        @click="period = item.value"
      >
        {{ item.label }}
      </button>
    </div>

    <ul class="flex flex-col gap-2">
      <li
        v-for="option in options"
        :key="option.planId"
      >
        <button
          type="button"
          class="w-full flex items-center justify-between gap-4 px-4 py-3 text-left border rounded-rui-control transition-colors"
          :class="option.planId === currentPlanId ? 'border-rui-primary bg-rui-primary-subtle cursor-default' : 'border-rui-divider hover:border-rui-primary'"
          :disabled="option.planId === currentPlanId"
          :data-cy="`plan-option-${option.planId}`"
          @click="emit('select', option.value)"
        >
          <span class="flex flex-col">
            <span class="font-medium text-rui-text">{{ option.label }}</span>
            <span
              v-if="option.planId === currentPlanId"
              class="text-xs text-rui-text-secondary"
            >
              {{ t('checkout.change_plan.current') }}
            </span>
          </span>
          <span class="text-rui-text tabular-nums whitespace-nowrap">{{ option.price }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

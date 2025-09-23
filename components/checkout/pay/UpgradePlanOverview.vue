<script setup lang="ts">
import type { SelectedPlan } from '~/types';
import { get } from '@vueuse/core';
import { formatDate } from '~/utils/date';
import { getPlanNameFor } from '~/utils/plans';

const props = defineProps<{
  plan: SelectedPlan;
  nextPayment?: number;
}>();

const { plan, nextPayment } = toRefs(props);

const { t } = useI18n({ useScope: 'global' });

const name = computed<string>(() => {
  const selectedPlan = get(plan);
  return `${getPlanNameFor(t, selectedPlan)} - € ${selectedPlan.price.toFixed(2)}`;
});

const nextPaymentDate = computed(() => {
  const next = get(nextPayment);
  if (!next) {
    return undefined;
  }
  const date = new Date(next * 1000);
  return formatDate(date);
});
</script>

<template>
  <RuiCard class="h-auto mt-6">
    <div class="text-rui-text text-h6">
      {{ t('home.plans.tiers.step_3.upgrade_to_plan') }}
    </div>
    <div class="pt-1 flex items-center justify-between gap-4">
      <div class="text-body-1 font-bold mr-1 text-rui-text-secondary">
        {{ name }}
      </div>
      <div
        v-if="nextPaymentDate"
        class="text-xs text-rui-text-secondary italic"
      >
        {{
          t('selected_plan_overview.next_payment', {
            date: nextPaymentDate,
          })
        }}
      </div>
    </div>
  </RuiCard>
</template>

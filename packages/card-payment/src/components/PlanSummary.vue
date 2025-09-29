<script setup lang="ts">
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { computed } from 'vue';

interface Props {
  selectedPlan: SelectedPlan;
  nextPayment?: number;
}

const props = defineProps<Props>();

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getPlanName(months: number): string {
  if (months === 1)
    return 'Monthly';
  else if (months === 12)
    return 'Yearly';

  return `${months} months`;
}

function getPlanNameFor(plan: SelectedPlan): string {
  return `${toTitleCase(plan.name)} ${getPlanName(plan.durationInMonths)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const name = computed<string>(() => `${getPlanNameFor(props.selectedPlan)} - € ${props.selectedPlan.price.toFixed(2)}`);

const nextPaymentDate = computed<string | undefined>(() => {
  if (!props.nextPayment) {
    return undefined;
  }
  const date = new Date(props.nextPayment * 1000);
  return formatDate(date);
});
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mt-6">
    <div class="text-gray-900 text-lg font-semibold mb-1">
      Your selected plan
    </div>
    <div class="flex items-center justify-between gap-4">
      <div>
        <div class="text-base font-bold text-gray-600">
          {{ name }}
        </div>
        <div
          v-if="nextPaymentDate"
          class="text-xs text-gray-500 italic"
        >
          Next payment: {{ nextPaymentDate }}
        </div>
      </div>
    </div>
  </div>
</template>

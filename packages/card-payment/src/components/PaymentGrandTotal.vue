<script setup lang="ts">
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { buildOrderSummary, type OrderSummary } from '@rotki/card-payment-common/utils/order-summary';
import { get } from '@vueuse/core';
import { computed } from 'vue';
import { formatDate } from '@/utils/date';

const {
  breakdown,
  selectedPlan,
  upgrade = false,
  nextPayment,
  durationInMonths,
} = defineProps<{
  breakdown?: PaymentBreakdownResponse;
  selectedPlan: SelectedPlan;
  upgrade?: boolean;
  nextPayment?: number;
  durationInMonths?: number;
}>();

const summary = computed<OrderSummary>(() => buildOrderSummary({ plan: selectedPlan, breakdown, upgrade }));

const durationLabel = computed<string>(() => {
  if (get(durationInMonths) === 12)
    return 'year';
  return 'month';
});

const hasAdjustments = computed<boolean>(() => {
  const { discount, credit } = get(summary);
  return !!discount || !!credit;
});

const nextPaymentDate = computed<string | undefined>(() => {
  const payment = get(nextPayment);
  if (!payment) {
    return undefined;
  }
  return formatDate(new Date(payment * 1000));
});
</script>

<template>
  <div class="pt-4">
    <!-- Discount section -->
    <div
      v-if="hasAdjustments"
      class="space-y-2 pb-3"
    >
      <!-- Original price before discount -->
      <div
        v-if="summary.discount && summary.vat.rate > 0"
        class="flex justify-between text-sm text-gray-500"
      >
        <span>Original price:</span>
        <span class="line-through">{{ summary.fullAmount.formatted }}</span>
      </div>

      <!-- Discount savings -->
      <div
        v-if="summary.discount"
        class="flex justify-between text-sm font-medium text-green-600"
      >
        <span>Discount savings:</span>
        <span>-{{ summary.discount.saved.formatted }}</span>
      </div>

      <div
        v-if="summary.credit"
        class="flex justify-between text-sm font-medium text-green-600"
      >
        <span>Credit applied:</span>
        <span>-{{ summary.credit.formatted }}</span>
      </div>
    </div>

    <!-- Divider between discount and breakdown -->
    <div
      v-if="hasAdjustments"
      class="border-t border-dashed border-gray-200 my-3"
    />

    <!-- VAT breakdown section -->
    <div class="space-y-2 pb-3">
      <!-- Subtotal (base price before VAT) -->
      <div class="flex justify-between text-sm text-gray-600">
        <span>Subtotal:</span>
        <span>{{ summary.subtotal.formatted }}</span>
      </div>

      <!-- VAT -->
      <div class="flex justify-between text-sm text-gray-600">
        <span>VAT ({{ summary.vat.formattedRate }}):</span>
        <span>{{ summary.vat.amount.formatted }}</span>
      </div>
    </div>

    <!-- Grand total with emphasis -->
    <div class="flex items-center justify-between pt-3 border-t border-gray-300">
      <span class="text-gray-800 font-semibold">
        Grand Total:
      </span>
      <div class="text-2xl font-bold text-rui-primary">
        {{ summary.dueToday.formatted }}
      </div>
    </div>

    <!-- Renewal info -->
    <div class="mt-3 text-xs text-gray-500 text-right">
      <div v-if="nextPaymentDate">
        Renews on: <span class="font-medium text-gray-700">{{ nextPaymentDate }}</span>
      </div>
      <div class="italic mt-1">
        You will be charged automatically each {{ durationLabel }} until you cancel
      </div>
    </div>
  </div>
</template>

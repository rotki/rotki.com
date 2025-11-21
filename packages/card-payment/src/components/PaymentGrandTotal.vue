<script setup lang="ts">
import type { CheckoutData, UpgradeData } from '@rotki/card-payment-common/schemas/checkout';
import type { DiscountInfo } from '@rotki/card-payment-common/schemas/discount';
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { getFinalAmount, isUpgradeData } from '@rotki/card-payment-common/utils/checkout';
import { get } from '@vueuse/core';
import { computed } from 'vue';

const { selectedPlan, discountInfo, planData, upgrade } = defineProps<{
  planData: CheckoutData | UpgradeData;
  selectedPlan: SelectedPlan;
  discountInfo?: DiscountInfo;
  upgrade: boolean;
}>();

const grandTotal = computed<number>(() =>
  getFinalAmount(get(planData), get(selectedPlan), get(discountInfo)),
);

const originalPrice = computed<number>(() => {
  const plan = get(planData);
  if (isUpgradeData(plan)) {
    return parseFloat(plan.finalAmount);
  }
  return get(selectedPlan).price;
});

const hasDiscount = computed<boolean>(() => {
  const discount = get(discountInfo);
  return !!discount && discount.isValid;
});

const savings = computed<number>(() => {
  if (!hasDiscount.value)
    return 0;
  return originalPrice.value - grandTotal.value;
});
</script>

<template>
  <div class="py-4 border-t border-gray-200">
    <!-- Show breakdown if discount is applied -->
    <div
      v-if="hasDiscount"
      class="space-y-2 mb-3"
    >
      <!-- Original price -->
      <div class="flex justify-between text-sm text-gray-600">
        <span>Subtotal:</span>
        <span class="line-through">{{ originalPrice.toFixed(2) }} €</span>
      </div>

      <!-- Discount amount -->
      <div class="flex justify-between text-sm text-green-600">
        <span>Discount:</span>
        <span>-{{ savings.toFixed(2) }} €</span>
      </div>
    </div>

    <!-- Grand total -->
    <div class="flex items-center justify-between">
      <span class="text-gray-700 font-medium">
        Grand Total:
      </span>
      <div class="text-xl font-bold text-gray-900 underline">
        {{ grandTotal.toFixed(2) }} €
      </div>
    </div>

    <div
      v-if="upgrade"
      class="flex gap-3 my-4 bg-blue-50 rounded-md p-4 text-blue-900 text-sm"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="fill-transparent"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
        />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>

      <div class="flex-1">
        Upgrade charges are calculated as the price difference between plans, prorated for your remaining subscription period. You'll only pay the difference for the time left in your current billing cycle.
      </div>
    </div>
  </div>
</template>

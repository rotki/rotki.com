<script setup lang="ts">
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/checkout';
import type { DiscountInfo } from '@rotki/card-payment-common/schemas/discount';
import { computed } from 'vue';

const { selectedPlan, discountInfo } = defineProps<{
  selectedPlan: SelectedPlan;
  discountInfo?: DiscountInfo;
}>();

const grandTotal = computed<number>(() => {
  const basePrice = selectedPlan.price;

  if (!discountInfo || !discountInfo.isValid) {
    return basePrice;
  }

  return discountInfo.finalPrice || basePrice;
});

const originalPrice = computed<number>(() => selectedPlan.price);

const hasDiscount = computed<boolean>(() => !!(discountInfo && discountInfo.isValid));

const savings = computed<number>(() => {
  if (!hasDiscount.value)
    return 0;
  return originalPrice.value - grandTotal.value;
});
</script>

<template>
  <div class="py-4 border-t border-b border-gray-200">
    <!-- Show breakdown if discount is applied -->
    <div
      v-if="hasDiscount"
      class="space-y-2 mb-3"
    >
      <!-- Original price -->
      <div class="flex justify-between text-sm text-gray-600">
        <span>Subtotal:</span>
        <span class="line-through">€{{ originalPrice.toFixed(2) }}</span>
      </div>

      <!-- Discount amount -->
      <div class="flex justify-between text-sm text-green-600">
        <span>Discount:</span>
        <span>-€{{ savings.toFixed(2) }}</span>
      </div>
    </div>

    <!-- Grand total -->
    <div class="flex items-center justify-between">
      <span class="text-gray-700 font-medium">
        Grand Total:
      </span>
      <div class="text-right">
        <div class="text-xl font-bold text-gray-900 underline">
          €{{ grandTotal.toFixed(2) }}
        </div>
        <div
          v-if="hasDiscount"
          class="text-xs text-green-600 font-medium"
        >
          You save €{{ savings.toFixed(2) }}!
        </div>
      </div>
    </div>
  </div>
</template>

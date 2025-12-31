<script setup lang="ts">
import type { PaymentBreakdownDiscount, ValidPaymentBreakdownDiscount } from '@rotki/card-payment-common/schemas/plans';
import { get } from '@vueuse/core';
import { computed } from 'vue';
import { formatDate } from '@/utils/date';

interface VatBreakdown {
  basePrice: string;
  vatAmount: string;
  vatRate: string;
  fullAmount: string;
}

const {
  vatBreakdown,
  grandTotal,
  discountInfo,
  nextPayment,
  durationInMonths,
} = defineProps<{
  grandTotal: number;
  vatBreakdown?: VatBreakdown;
  discountInfo?: PaymentBreakdownDiscount;
  nextPayment?: number;
  durationInMonths?: number;
}>();

const durationLabel = computed<string>(() => {
  if (get(durationInMonths) === 12)
    return 'year';
  return 'month';
});

function isValidDiscount(info: PaymentBreakdownDiscount | undefined): info is ValidPaymentBreakdownDiscount {
  return !!(info && info.isValid);
}

const hasDiscount = computed<boolean>(() => isValidDiscount(get(discountInfo)));

const nextPaymentDate = computed<string | undefined>(() => {
  const payment = get(nextPayment);
  if (!payment) {
    return undefined;
  }
  return formatDate(new Date(payment * 1000));
});

const priceBreakdown = computed<{ subtotal: string; vatRate: string; vatAmount: string }>(() => {
  const breakdown = get(vatBreakdown);
  return {
    subtotal: breakdown?.basePrice ?? grandTotal.toFixed(2),
    vatRate: breakdown?.vatRate ?? '0',
    vatAmount: breakdown?.vatAmount ?? '0',
  };
});
</script>

<template>
  <div class="pt-4">
    <!-- Discount section -->
    <div
      v-if="hasDiscount"
      class="space-y-2 pb-3"
    >
      <!-- Original price before discount -->
      <div
        v-if="vatBreakdown"
        class="flex justify-between text-sm text-gray-500"
      >
        <span>Original price:</span>
        <span class="line-through">{{ vatBreakdown.fullAmount }} €</span>
      </div>

      <!-- Discount savings -->
      <div
        v-if="isValidDiscount(discountInfo)"
        class="flex justify-between text-sm font-medium text-green-600"
      >
        <span>Discount savings:</span>
        <span>-{{ discountInfo.discountedAmount }} €</span>
      </div>
    </div>

    <!-- Divider between discount and breakdown -->
    <div
      v-if="hasDiscount && vatBreakdown"
      class="border-t border-dashed border-gray-200 my-3"
    />

    <!-- VAT breakdown section -->
    <div class="space-y-2 pb-3">
      <!-- Subtotal (base price before VAT) -->
      <div class="flex justify-between text-sm text-gray-600">
        <span>Subtotal:</span>
        <span>{{ priceBreakdown.subtotal }} €</span>
      </div>

      <!-- VAT -->
      <div class="flex justify-between text-sm text-gray-600">
        <span>VAT ({{ priceBreakdown.vatRate }}%):</span>
        <span>{{ priceBreakdown.vatAmount }} €</span>
      </div>
    </div>

    <!-- Grand total with emphasis -->
    <div class="flex items-center justify-between pt-3 border-t border-gray-300">
      <span class="text-gray-800 font-semibold">
        Grand Total:
      </span>
      <div class="text-2xl font-bold text-rui-primary">
        {{ grandTotal.toFixed(2) }} €
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

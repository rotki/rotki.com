<script setup lang="ts">
import type { PaymentBreakdownDiscount, ValidPaymentBreakdownDiscount } from '@rotki/card-payment-common/schemas/plans';
import { get } from '@vueuse/core';
import { computed } from 'vue';

interface VatBreakdown {
  basePrice: string;
  vatAmount: string;
  vatRate: string;
  fullAmount: string;
}

const { vatBreakdown, discountInfo, nextPayment, durationInMonths } = defineProps<{
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

const grandTotal = computed<number>(() => {
  const vat = get(vatBreakdown);
  if (vat) {
    return parseFloat(vat.basePrice) + parseFloat(vat.vatAmount);
  }
  return 0;
});

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

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
    <div
      v-if="vatBreakdown"
      class="space-y-2 pb-3"
    >
      <!-- Subtotal (base price before VAT) -->
      <div class="flex justify-between text-sm text-gray-600">
        <span>Subtotal:</span>
        <span>{{ vatBreakdown.basePrice }} €</span>
      </div>

      <!-- VAT -->
      <div class="flex justify-between text-sm text-gray-600">
        <span>VAT ({{ vatBreakdown.vatRate }}%):</span>
        <span>{{ vatBreakdown.vatAmount }} €</span>
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

<script setup lang="ts">
import type { CheckoutData } from '@/types';

interface Props {
  planData: CheckoutData;
}

defineProps<Props>();
</script>

<template>
  <div class="mb-6">
    <h3 class="text-body-1 font-medium text-rui-text mb-3">
      Selected Plan
    </h3>
    <div class="p-4 bg-rui-grey-50 rounded-lg">
      <div class="flex justify-between items-center">
        <div>
          <p class="font-medium text-rui-text">
            {{ planData.months === 12 ? 'Premium Plan (Annual)' : `Premium Plan (${planData.months} months)` }}
          </p>
          <p class="text-sm text-rui-text-secondary">
            {{ planData.months }} months subscription
          </p>
        </div>
        <div class="text-right">
          <p class="text-lg font-bold text-rui-text">
            €{{ planData.finalPriceInEur }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

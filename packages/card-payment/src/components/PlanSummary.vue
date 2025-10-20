<script setup lang="ts">
import type { CheckoutData } from '@/types';
import { get } from '@vueuse/core';
import { computed } from 'vue';

interface Props {
  planData: CheckoutData;
}

const { planData } = defineProps<Props>();

const date = computed(() => {
  const currentPlan = get(planData);
  const date = new Date(currentPlan.startDate * 1000);
  return date.toLocaleDateString();
});

const vatOverview = computed(() => {
  const cPlan = get(planData);
  if (!(cPlan.vat && 'priceInEur' in cPlan))
    return undefined;

  return {
    vat: cPlan.vat,
    priceInEur: cPlan.priceInEur,
  };
});
</script>

<template>
  <div class="mb-6">
    <h3 class="text-body-1 font-medium text-rui-text mb-3">
      Selected Plan
    </h3>
    <div class="p-4 border rounded-lg">
      <div class="flex justify-between items-center">
        <div>
          <p class="font-bold text-rui-text">
            {{ planData.months === 12 ? 'Premium Plan (Yearly)' : `Premium Plan (Monthly)` }}
          </p>
          <div class="text-rui-text-secondary text-sm">
            <div class="font-medium">
              {{ planData.months === 12 ? '1 year (12 months) recurring subscription' : '1 month recurring subscription' }}
            </div>
            <div class="mt-3">
              Price: <span class="font-bold">{{ planData.finalPriceInEur }} €</span>
              <template v-if="vatOverview">
                ({{ vatOverview.priceInEur }} + {{ vatOverview.vat }}% VAT)
              </template>
            </div>
            <div>
              Starting: <span class="font-bold">{{ date }}</span>
            </div>
            <p class="text-xs italic mt-1">
              You will be charged automatically each {{ planData.months === 12 ? 'year' : 'month' }} until you cancel
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

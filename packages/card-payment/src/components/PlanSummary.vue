<script setup lang="ts">
import type { PriceBreakdown, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { isDefined, watchImmediate } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { computed, onMounted, ref } from 'vue';
import { getPriceBreakdown } from '@/utils/api';

interface Props {
  selectedPlan: SelectedPlan;
  nextPayment?: number;
}

interface VatOverview { vat: string; basePrice: string }

const { selectedPlan, nextPayment } = defineProps<Props>();

const priceBreakdown = ref<PriceBreakdown>();
const isLoadingPriceBreakdown = ref<boolean>(false);

const name = computed<string>(() => getPlanNameFor(selectedPlan));

const date = computed<string>(() => formatDate(new Date()));

const durationDescription = computed<string>(() => {
  if (selectedPlan.durationInMonths === 12)
    return '1 year (12 months) recurring subscription';
  return '1 month recurring subscription';
});

const durationLabel = computed<string>(() => {
  if (selectedPlan.durationInMonths === 12)
    return 'year';
  return 'month';
});

const vatOverview = computed<VatOverview | undefined>(() => {
  if (!isDefined(priceBreakdown)) {
    return undefined;
  }
  const { vatRate, priceBreakdown: breakdown } = get(priceBreakdown);

  const floatRate = parseFloat(vatRate);
  if (isFinite(floatRate) && floatRate <= 0) {
    return undefined;
  }

  return {
    vat: vatRate,
    basePrice: breakdown.basePrice,
  };
});

const nextPaymentDate = computed<string | undefined>(() => {
  if (!nextPayment) {
    return undefined;
  }
  const date = new Date(nextPayment * 1000);
  return formatDate(date);
});

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getPlanName(months: number): string {
  if (months === 12)
    return 'Yearly';

  return 'Monthly';
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

async function fetchPriceBreakdown(): Promise<void> {
  set(isLoadingPriceBreakdown, true);
  try {
    const breakdown = await getPriceBreakdown(selectedPlan.planId);
    set(priceBreakdown, breakdown);
  }
  catch (error) {
    console.error('Failed to fetch price breakdown:', error);
  }
  finally {
    set(isLoadingPriceBreakdown, false);
  }
}

watchImmediate(selectedPlan, (newPlan, oldPlan) => {
  if (newPlan && newPlan.planId !== oldPlan?.planId) {
    fetchPriceBreakdown();
  }
});

onMounted(() => {
  fetchPriceBreakdown();
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
            {{ name }}
          </p>
          <div class="text-rui-text-secondary text-sm">
            <div class="font-medium">
              {{ durationDescription }}
            </div>
            <div class="mt-3">
              Price: <span class="font-bold">{{ selectedPlan.price }} €</span>
              <template v-if="vatOverview">
                ({{ vatOverview.basePrice }} + {{ vatOverview.vat }}% VAT)
              </template>
            </div>
            <div>
              Starting: <span class="font-bold">{{ date }}</span>
              <div
                v-if="nextPaymentDate"
                class="text-xs text-gray-500"
              >
                Next payment: <span class="font-bold">{{ nextPaymentDate }}</span>
              </div>
            </div>
            <p class="text-xs italic mt-1">
              You will be charged automatically each {{ durationLabel }} until you cancel
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

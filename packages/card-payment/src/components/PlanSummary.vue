<script setup lang="ts">
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { watchImmediate } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { computed, onMounted, ref, toRefs, watch } from 'vue';
import { getPaymentBreakdown } from '@/utils/api';
import { formatDate } from '@/utils/date';

interface Props {
  upgrade: boolean;
  selectedPlan: SelectedPlan;
  discountCode?: string;
}

const breakdown = defineModel<PaymentBreakdownResponse | undefined>('breakdown', { required: false });

const props = defineProps<Props>();

const { upgrade, selectedPlan, discountCode } = toRefs(props);

const isLoadingBreakdown = ref<boolean>(false);

const name = computed<string>(() => getPlanNameFor(get(selectedPlan)));

const date = computed<string>(() => formatDate(new Date()));

const durationDescription = computed<string>(() => {
  if (get(selectedPlan).durationInMonths === 12)
    return '1 year (12 months) recurring subscription';
  return '1 month recurring subscription';
});

const displayPrice = computed<string>(() => {
  const currentBreakdown = get(breakdown);
  if (currentBreakdown && !get(upgrade)) {
    return currentBreakdown.fullAmount;
  }
  return get(selectedPlan).price.toString();
});

const proratedPrice = computed<string | undefined>(() => {
  const currentBreakdown = get(breakdown);
  if (!currentBreakdown || !get(upgrade)) {
    return undefined;
  }
  return currentBreakdown.finalAmount;
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

async function loadPaymentBreakdown(): Promise<void> {
  set(isLoadingBreakdown, true);
  try {
    const code = get(discountCode);
    const response = await getPaymentBreakdown({
      newPlanId: get(selectedPlan).planId,
      isCryptoPayment: false,
      ...(code ? { discountCode: code } : {}),
    });
    set(breakdown, response ?? undefined);
  }
  catch (error) {
    console.error('Failed to fetch payment breakdown:', error);
  }
  finally {
    set(isLoadingBreakdown, false);
  }
}

watchImmediate(selectedPlan, (newPlan, oldPlan) => {
  if (newPlan && newPlan.planId !== oldPlan?.planId) {
    loadPaymentBreakdown();
  }
});

// Refresh breakdown when discount code changes
watch(discountCode, () => {
  loadPaymentBreakdown();
});

onMounted(() => {
  loadPaymentBreakdown();
});
</script>

<template>
  <div class="mb-4">
    <!-- Plan name with upgrade badge -->
    <div class="flex items-center gap-2 mb-1">
      <span class="text-base font-semibold text-rui-text">{{ name }}</span>
      <span
        v-if="upgrade"
        class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-rui-primary/10 text-rui-primary rounded-full"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        </svg>
        Upgrade
      </span>
    </div>

    <!-- Duration description -->
    <p class="text-sm text-gray-500 mb-3">
      {{ durationDescription }}
    </p>

    <!-- Price details -->
    <div class="space-y-1.5 text-sm">
      <!-- Full price (shown for both regular and upgrade) -->
      <div class="flex justify-between">
        <span class="text-gray-600">{{ proratedPrice ? 'Full price:' : 'Price:' }}</span>
        <span :class="proratedPrice ? 'text-gray-400 line-through' : 'font-medium text-rui-text'">
          {{ displayPrice }} €
        </span>
      </div>

      <!-- Prorated price (upgrade only) -->
      <div
        v-if="proratedPrice"
        class="flex justify-between items-center"
      >
        <span class="flex items-center gap-1 text-gray-600">
          Prorated price:
          <span class="relative group">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-gray-400 cursor-help"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
              />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 w-64 text-center z-10">
              Upgrade charges are calculated as the price difference between plans, prorated for your remaining subscription period.
            </span>
          </span>
        </span>
        <span class="font-medium text-rui-primary">{{ proratedPrice }} €</span>
      </div>

      <!-- Starting date -->
      <div class="flex justify-between pt-1">
        <span class="text-gray-600">Starting:</span>
        <span class="font-medium text-rui-text">{{ date }}</span>
      </div>
    </div>
  </div>
</template>

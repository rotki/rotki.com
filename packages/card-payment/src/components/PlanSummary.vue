<script setup lang="ts">
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import PlanLine from '@rotki/checkout-ui/components/PlanLine.vue';
import { watchImmediate } from '@vueuse/core';
import { set } from '@vueuse/shared';
import { ref, watch } from 'vue';
import { getPaymentBreakdown } from '@/utils/api';

interface Props {
  upgrade: boolean;
  selectedPlan: SelectedPlan;
  discountCode?: string;
}

const breakdown = defineModel<PaymentBreakdownResponse | undefined>('breakdown', { required: false });

const { upgrade, selectedPlan, discountCode } = defineProps<Props>();

const isLoadingBreakdown = ref<boolean>(false);

// Starts on payment, which is today.
const startsAt = new Date();

let breakdownRequestId = 0;

/**
 * Fetches the breakdown for the current plan and code. Requests run concurrently, so a
 * response overtaken by a newer request is dropped: applying it would price the order
 * without the code and make CardPayment clear a valid discount.
 */
async function loadPaymentBreakdown(): Promise<void> {
  const requestId = ++breakdownRequestId;
  set(isLoadingBreakdown, true);
  try {
    const code = discountCode;
    const response = await getPaymentBreakdown({
      newPlanId: selectedPlan.planId,
      isCryptoPayment: false,
      ...(code ? { discountCode: code } : {}),
    });
    if (requestId === breakdownRequestId)
      set(breakdown, response ?? undefined);
  }
  catch (error) {
    console.error('Failed to fetch payment breakdown:', error);
  }
  finally {
    if (requestId === breakdownRequestId)
      set(isLoadingBreakdown, false);
  }
}

watchImmediate(() => selectedPlan, (newPlan, oldPlan) => {
  if (newPlan && newPlan.planId !== oldPlan?.planId) {
    loadPaymentBreakdown();
  }
});

// Refresh breakdown when discount code changes
watch(() => discountCode, () => {
  loadPaymentBreakdown();
});
</script>

<template>
  <PlanLine
    class="mb-4"
    :plan="selectedPlan"
    :upgrade="upgrade"
    :starts-at="startsAt"
  />
</template>

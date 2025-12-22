<script setup lang="ts">
import type { PaymentBreakdownDiscount, PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { CryptoPayment } from '~/types';
import { get, toRefs } from '@vueuse/core';
import DiscountCodeInput from '~/components/checkout/pay/DiscountCodeInput.vue';
import PaymentGrandTotal from '~/components/checkout/pay/PaymentGrandTotal.vue';
import SelectedPlanOverview from '~/components/checkout/pay/SelectedPlanOverview.vue';

interface VatBreakdown {
  basePrice: string;
  vatAmount: string;
  vatRate: string;
  fullAmount: string;
}

const discountCode = defineModel<string>('discountCode', { required: true });

const props = withDefaults(
  defineProps<{
    plan: SelectedPlan;
    upgradeSubId?: string;
    nextPayment?: number;
    checkoutData?: CryptoPayment | PaymentBreakdownResponse | null;
    crypto?: boolean;
    disabled?: boolean;
    loading?: boolean;
    internalMode?: boolean;
    warning?: boolean;
    compact?: boolean;
  }>(),
  {
    upgradeSubId: undefined,
    nextPayment: undefined,
    checkoutData: undefined,
    crypto: false,
    disabled: false,
    loading: false,
    internalMode: false,
    warning: false,
    compact: false,
  },
);

const emit = defineEmits<{
  'plan-change': [plan: SelectedPlan];
}>();

const { t } = useI18n({ useScope: 'global' });

const {
  plan,
  upgradeSubId,
  checkoutData,
  crypto,
  disabled,
  loading,
  internalMode,
  warning,
  compact,
} = toRefs(props);

// Breakdown from SelectedPlanOverview via v-model
const breakdown = ref<PaymentBreakdownResponse>();

const spacingClass = computed<string>(() => (get(compact) ? 'my-4' : 'my-6'));
const titleSpacingClass = computed<string>(() => (get(compact) ? 'mb-4' : 'mb-6'));
const discountSpacingClass = computed<string>(() => (get(compact) ? 'mb-4' : 'mb-6'));

// Derive discountInfo from breakdown
const discountInfo = computed<PaymentBreakdownDiscount | undefined>(() => {
  const currentBreakdown = get(breakdown);
  return currentBreakdown?.discount ?? undefined;
});

// Derive vatBreakdown from breakdown
const vatBreakdown = computed<VatBreakdown | undefined>(() => {
  const currentBreakdown = get(breakdown);
  if (!currentBreakdown) {
    return undefined;
  }

  const floatRate = parseFloat(currentBreakdown.vatRate);
  if (isFinite(floatRate) && floatRate <= 0) {
    return undefined;
  }

  const vatRate = floatRate > 0 && floatRate < 1 ? `${floatRate * 100}` : currentBreakdown.vatRate;
  const finalAmount = parseFloat(currentBreakdown.finalAmount);
  const vatAmount = parseFloat(currentBreakdown.vatAmount);
  const basePrice = (finalAmount - vatAmount).toFixed(2);

  return {
    basePrice,
    vatAmount: vatAmount.toFixed(2),
    vatRate,
    fullAmount: currentBreakdown.fullAmount,
  };
});

const grandTotal = computed<number>(() => {
  const currentBreakdown = get(breakdown);
  const currentCheckoutData = get(checkoutData);

  // Use breakdown if available
  if (currentBreakdown) {
    return parseFloat(currentBreakdown.finalAmount);
  }

  // Fallback to checkoutData for crypto payments
  if (currentCheckoutData && 'finalPriceInEur' in currentCheckoutData) {
    return currentCheckoutData.finalPriceInEur;
  }

  // Fallback to plan price
  return get(plan).price;
});

function handlePlanChange(newPlan: SelectedPlan): void {
  emit('plan-change', newPlan);
}
</script>

<template>
  <RuiCard>
    <div
      class="text-lg font-medium"
      :class="titleSpacingClass"
    >
      {{ t('home.plans.tiers.step_3.order_summary') }}
    </div>

    <SelectedPlanOverview
      v-model:breakdown="breakdown"
      :plan="plan"
      :upgrade="!!upgradeSubId"
      :crypto="crypto"
      :disabled="disabled"
      :loading="loading"
      :internal-mode="internalMode"
      :warning="warning"
      :discount-code="discountCode"
      @plan-change="handlePlanChange($event)"
    />

    <RuiDivider :class="spacingClass" />

    <DiscountCodeInput
      v-model="discountCode"
      :plan="plan"
      :crypto="crypto"
      :disabled="disabled"
      :discount-info="discountInfo"
      :class="discountSpacingClass"
    />

    <PaymentGrandTotal
      :plan="plan"
      :grand-total="grandTotal"
      :loading="loading"
      :discount-info="discountInfo"
      :crypto="crypto"
      :vat-breakdown="vatBreakdown"
    />
  </RuiCard>
</template>

<script setup lang="ts">
import type { PaymentBreakdownDiscount, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get } from '@vueuse/shared';
import DiscountCodeInput from '~/components/checkout/pay/DiscountCodeInput.vue';
import PaymentGrandTotal from '~/components/checkout/pay/PaymentGrandTotal.vue';
import SelectedPlanOverview from '~/components/checkout/pay/SelectedPlanOverview.vue';
import { useCheckout } from '~/composables/checkout/use-checkout';

interface VatBreakdown {
  basePrice: string;
  vatAmount: string;
  vatRate: string;
  fullAmount: string;
}

const props = withDefaults(
  defineProps<{
    internalMode?: boolean;
    warning?: boolean;
    compact?: boolean;
  }>(),
  {
    internalMode: false,
    warning: false,
    compact: false,
  },
);

const emit = defineEmits<{
  'plan-change': [plan: SelectedPlan];
}>();

const { t } = useI18n({ useScope: 'global' });

const { compact, internalMode, warning } = toRefs(props);

// Use shared checkout state
const {
  effectiveSelectedPlan,
  breakdown,
  upgradeSubId,
  breakdownLoading,
  isCrypto,
  discountCodeInput,
  applyDiscount,
  planSwitchLoading,
  web3ProcessingLoading,
} = useCheckout();

// Computed loading state
const loading = computed<boolean>(() => get(planSwitchLoading) || get(breakdownLoading));
const disabled = computed<boolean>(() => get(planSwitchLoading) || get(web3ProcessingLoading));

// Spacing classes based on compact mode
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

  if (currentBreakdown) {
    return parseFloat(currentBreakdown.finalAmount);
  }

  // Fallback to plan price
  const plan = get(effectiveSelectedPlan);
  return plan?.price ?? 0;
});

function handlePlanChange(newPlan: SelectedPlan): void {
  emit('plan-change', newPlan);
}
</script>

<template>
  <RuiCard v-if="effectiveSelectedPlan">
    <div
      class="text-lg font-medium"
      :class="titleSpacingClass"
    >
      {{ t('home.plans.tiers.step_3.order_summary') }}
    </div>

    <SelectedPlanOverview
      :plan="effectiveSelectedPlan"
      :breakdown="breakdown"
      :upgrade="!!upgradeSubId"
      :crypto="isCrypto"
      :disabled="disabled"
      :loading="loading"
      :internal-mode="internalMode"
      :warning="warning"
      @plan-change="handlePlanChange($event)"
    />

    <RuiDivider :class="spacingClass" />

    <DiscountCodeInput
      v-model="discountCodeInput"
      :plan="effectiveSelectedPlan"
      :crypto="isCrypto"
      :disabled="disabled"
      :discount-info="discountInfo"
      :class="discountSpacingClass"
      @apply="applyDiscount()"
    />

    <PaymentGrandTotal
      :plan="effectiveSelectedPlan"
      :grand-total="grandTotal"
      :loading="loading"
      :discount-info="discountInfo"
      :crypto="isCrypto"
      :vat-breakdown="vatBreakdown"
    />
  </RuiCard>
</template>

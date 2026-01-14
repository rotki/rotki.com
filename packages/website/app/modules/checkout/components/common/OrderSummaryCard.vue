<script setup lang="ts">
import type { PaymentBreakdownDiscount, PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get } from '@vueuse/shared';
import DiscountCodeInput from '~/modules/checkout/components/common/DiscountCodeInput.vue';
import PaymentGrandTotal from '~/modules/checkout/components/common/PaymentGrandTotal.vue';
import SelectedPlanOverview from '~/modules/checkout/components/common/SelectedPlanOverview.vue';

interface VatBreakdown {
  basePrice: string;
  vatAmount: string;
  vatRate: string;
  fullAmount: string;
}

const discountCodeInput = defineModel<string>('discountCode', { default: '' });

const props = withDefaults(
  defineProps<{
    selectedPlan?: SelectedPlan;
    breakdown?: PaymentBreakdownResponse;
    upgradeSubId?: string;
    isCrypto?: boolean;
    warning?: boolean;
    compact?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    selectedPlan: undefined,
    breakdown: undefined,
    upgradeSubId: undefined,
    isCrypto: false,
    warning: false,
    compact: false,
    loading: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  'plan-change': [plan: SelectedPlan];
  'apply-discount': [];
}>();

const { t } = useI18n({ useScope: 'global' });

const { selectedPlan, breakdown, upgradeSubId, isCrypto, compact, warning, loading, disabled } = toRefs(props);

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
  const plan = get(selectedPlan);
  return plan?.price ?? 0;
});

function handlePlanChange(newPlan: SelectedPlan): void {
  emit('plan-change', newPlan);
}
</script>

<template>
  <RuiCard v-if="selectedPlan">
    <div
      class="text-lg font-medium"
      :class="titleSpacingClass"
    >
      {{ t('home.plans.tiers.step_3.order_summary') }}
    </div>

    <SelectedPlanOverview
      :plan="selectedPlan"
      :breakdown="breakdown"
      :upgrade="!!upgradeSubId"
      :crypto="isCrypto"
      :disabled="disabled"
      :loading="loading"
      :warning="warning"
      @plan-change="handlePlanChange($event)"
    />

    <RuiDivider :class="spacingClass" />

    <DiscountCodeInput
      v-model="discountCodeInput"
      :plan="selectedPlan"
      :crypto="isCrypto"
      :disabled="disabled"
      :discount-info="discountInfo"
      :class="discountSpacingClass"
      @apply="emit('apply-discount')"
    />

    <PaymentGrandTotal
      :plan="selectedPlan"
      :grand-total="grandTotal"
      :loading="loading"
      :discount-info="discountInfo"
      :crypto="isCrypto"
      :vat-breakdown="vatBreakdown"
    />
  </RuiCard>
</template>

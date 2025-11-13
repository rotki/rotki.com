<script setup lang="ts">
import type { CheckoutData, UpgradeData } from '@rotki/card-payment-common/schemas/checkout';
import type { DiscountInfo } from '@rotki/card-payment-common/schemas/discount';
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { CryptoPayment, CryptoUpgradeProrate } from '~/types';
import { getDiscountedPrice, getFinalAmount } from '@rotki/card-payment-common/utils/checkout';
import { get, toRefs } from '@vueuse/core';

const discountCode = defineModel<string>('discountCode', { required: true });
const discountInfo = defineModel<DiscountInfo | undefined>('discountInfo', { required: true });

const props = withDefaults(
  defineProps<{
    plan: SelectedPlan;
    upgradeSubId?: string;
    nextPayment?: number;
    checkoutData?: CheckoutData | UpgradeData | CryptoPayment | CryptoUpgradeProrate | null;
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
  nextPayment,
  checkoutData,
  crypto,
  disabled,
  loading,
  internalMode,
  warning,
  compact,
} = toRefs(props);

const spacingClass = computed<string>(() => (get(compact) ? 'my-4' : 'my-6'));
const titleSpacingClass = computed<string>(() => (get(compact) ? 'mb-4' : 'mb-6'));
const discountSpacingClass = computed<string>(() => (get(compact) ? 'mb-4' : 'mb-6'));

const grandTotal = computed<number>(() => {
  const currentPlan = get(plan);
  const currentDiscountInfo = get(discountInfo);
  const currentCheckoutData = get(checkoutData);

  if (!currentPlan) {
    return 0;
  }

  // If checkoutData is available
  if (currentCheckoutData) {
    // Check if it's CryptoPayment with finalPriceInEur (for crypto upgrades)
    if ('finalPriceInEur' in currentCheckoutData) {
      return currentCheckoutData.finalPriceInEur;
    }

    // If it's a prorated crypto payment request
    if ('finalAmount' in currentCheckoutData) {
      return Number(currentCheckoutData.finalAmount);
    }

    // Otherwise use getFinalAmount (handles card payment upgrades)
    return getFinalAmount(currentCheckoutData, currentPlan, currentDiscountInfo);
  }

  // Otherwise use simpler getDiscountedPrice
  return getDiscountedPrice(currentPlan, currentDiscountInfo);
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
      :plan="plan"
      :upgrade="!!upgradeSubId"
      :next-payment="nextPayment"
      :crypto="crypto"
      :disabled="disabled"
      :loading="loading"
      :internal-mode="internalMode"
      :warning="warning"
      @plan-change="handlePlanChange($event)"
    />

    <RuiDivider :class="spacingClass" />

    <DiscountCodeInput
      v-model="discountCode"
      v-model:discount-info="discountInfo"
      :plan="plan"
      :disabled="disabled"
      :upgrade-sub-id="upgradeSubId"
      :class="discountSpacingClass"
    />

    <PaymentGrandTotal
      :plan="plan"
      :grand-total="grandTotal"
      :upgrade="!!upgradeSubId"
      :loading="loading"
      :discount-info="discountInfo"
    />
  </RuiCard>
</template>

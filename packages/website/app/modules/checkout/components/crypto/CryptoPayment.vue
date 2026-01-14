<script setup lang="ts">
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get } from '@vueuse/shared';
import CheckoutDescription from '~/modules/checkout/components/common/CheckoutDescription.vue';
import PaymentLayout from '~/modules/checkout/components/common/PaymentLayout.vue';
import CryptoPaymentActions from '~/modules/checkout/components/crypto/CryptoPaymentActions.vue';
import CryptoPaymentForm from '~/modules/checkout/components/crypto/CryptoPaymentForm.vue';
import { useCheckout } from '~/modules/checkout/composables/use-checkout';
import { useCryptoPaymentFlow } from '~/modules/checkout/composables/use-crypto-payment-flow';

const { t } = useI18n({ useScope: 'global' });

const checkout = useCheckout();
const {
  loading: checkoutLoading,
  error,
  selectedPlan,
  breakdown,
  upgradeSubId,
  subscriptionId,
  currency,
  discountCodeInput,
  appliedDiscountCode,
  planSwitchLoading,
  planId,
  clearError,
  setError,
  setLoading,
  applyDiscount,
  ensureInitialized,
  switchPlan: checkoutSwitchPlan,
} = checkout;

const {
  paymentData,
  loading: flowLoading,
  createPayment,
  switchPlan: flowSwitchPlan,
  cancelPayment,
} = useCryptoPaymentFlow();

const loading = computed<boolean>(() => get(checkoutLoading) || get(flowLoading));

function handleWeb3Error(message: string): void {
  setError(t('subscription.error.payment_failure'), message);
}

async function initialize(): Promise<boolean> {
  const hasPlans = await ensureInitialized();
  if (!hasPlans) {
    return false;
  }

  const currencyValue = get(currency);
  const plan = get(selectedPlan);
  if (!currencyValue || !plan) {
    return false;
  }

  setLoading(true);
  clearError();

  const result = await createPayment({
    planId: plan.planId,
    currency: currencyValue,
    discountCode: get(appliedDiscountCode) || undefined,
    subscriptionId: get(subscriptionId),
    upgradeSubId: get(upgradeSubId),
  });

  setLoading(false);

  if (!result.success) {
    const errorMsg = result.isUnverified
      ? t('subscription.error.unverified_email')
      : result.error || t('subscription.error.payment_failure');
    setError(t('subscription.error.payment_failure'), errorMsg);
    return false;
  }

  if (result.alreadyStarted) {
    sessionStorage.setItem('payment-completed', 'true');
    await navigateTo({ name: 'checkout-success', query: { crypto: '1' } });
    return true;
  }

  return true;
}

async function handlePlanChange(newPlan: SelectedPlan): Promise<void> {
  const currencyValue = get(currency);
  if (!currencyValue)
    return;

  const success = await checkoutSwitchPlan(newPlan);
  if (!success)
    return;

  const result = await flowSwitchPlan({
    planId: newPlan.planId,
    currency: currencyValue,
    discountCode: get(appliedDiscountCode) || undefined,
    subscriptionId: get(subscriptionId),
    upgradeSubId: get(upgradeSubId),
  });

  if (!result.success) {
    setError(t('subscription.error.payment_failure'), result.error || 'Failed to switch plan');
  }
}

/**
 * Cancel and go back
 */
async function handleCancelAndGoBack(): Promise<void> {
  setLoading(true);

  const result = await cancelPayment(get(upgradeSubId));

  setLoading(false);

  if (!result.success) {
    setError(t('subscription.error.cancel_failed'), result.error || 'Failed to cancel');
    return;
  }

  // Navigate back
  if (get(upgradeSubId)) {
    await navigateTo({ name: 'home-subscription' });
  }
  else {
    await navigateTo({
      name: 'checkout-pay-request-crypto',
      query: {
        planId: get(planId),
        id: get(subscriptionId),
        discountCode: get(appliedDiscountCode) || undefined,
      },
    });
  }
}

/**
 * Navigate to products page
 */
async function navigateToProducts(): Promise<void> {
  await navigateTo('/products');
}

// Initialize on mount
onMounted(async () => {
  const success = await initialize();
  if (!success && !get(paymentData)) {
    await navigateToProducts();
  }
});
</script>

<template>
  <PaymentLayout
    :error="error"
    :loading="loading"
    @clear-error="clearError()"
  >
    <template #description>
      <CheckoutDescription>
        {{ t('home.plans.tiers.step_3.subtitle') }}
      </CheckoutDescription>
    </template>

    <CryptoPaymentForm
      v-if="paymentData && selectedPlan"
      v-model:discount-code="discountCodeInput"
      :data="paymentData"
      :plan="selectedPlan"
      :plan-switch-loading="planSwitchLoading"
      :web3-processing-loading="flowLoading"
      :upgrade-sub-id="upgradeSubId"
      :breakdown="breakdown"
      @change="handleCancelAndGoBack()"
      @plan-change="handlePlanChange($event)"
      @apply-discount="applyDiscount()"
      @error="handleWeb3Error($event)"
    />

    <CryptoPaymentActions
      v-else
      :loading="loading"
      :error="error?.message"
      @back="handleCancelAndGoBack()"
    />
  </PaymentLayout>
</template>

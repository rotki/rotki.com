<script setup lang="ts">
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import CheckoutAlert from '@rotki/checkout-ui/components/CheckoutAlert.vue';
import { CheckoutPaymentMethods } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';
import CheckoutLoadingOverlay from '~/modules/checkout/components/common/CheckoutLoadingOverlay.vue';
import CryptoPaymentActions from '~/modules/checkout/components/crypto/CryptoPaymentActions.vue';
import CryptoSendPage from '~/modules/checkout/components/crypto/CryptoSendPage.vue';
import { useCheckout } from '~/modules/checkout/composables/use-checkout';
import { useCryptoPaymentFlow } from '~/modules/checkout/composables/use-crypto-payment-flow';
import { paymentFailureMessage } from '~/modules/checkout/utils/payment-failure';
import { buildPaymentReceipt, storePaymentReceipt } from '~/modules/checkout/utils/payment-receipt';

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
  modelDiscountCode,
  validDiscountCode,
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

/** False until the first load finishes; before that the page has nothing to show but its loading state. */
const initialized = ref<boolean>(false);

const loading = computed<boolean>(() => get(checkoutLoading) || get(flowLoading));

function handleWeb3Error({ title, message }: { title: string; message: string }): void {
  setError(title, message, CheckoutPaymentMethods.CRYPTO);
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
    discountCode: get(validDiscountCode),
    subscriptionId: get(subscriptionId),
    upgradeSubId: get(upgradeSubId),
  });

  setLoading(false);

  if (!result.ok) {
    const errorMsg = result.error._tag === 'Unverified'
      ? t('subscription.error.unverified_email')
      : paymentFailureMessage(result.error);
    setError(t('subscription.error.payment_failure'), errorMsg, CheckoutPaymentMethods.CRYPTO);
    return false;
  }

  // An existing payment already on its way has nothing left to send here.
  if (result.value.transactionStarted) {
    storePaymentReceipt(buildPaymentReceipt('crypto', plan, get(breakdown), !!get(upgradeSubId)));
    await navigateTo({ name: 'checkout-success' });
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
    discountCode: get(validDiscountCode),
    subscriptionId: get(subscriptionId),
    upgradeSubId: get(upgradeSubId),
  });

  if (!result.ok) {
    setError(t('subscription.error.payment_failure'), paymentFailureMessage(result.error), CheckoutPaymentMethods.CRYPTO);
  }
}

/**
 * Cancels the pending crypto payment, then returns to the subscription page for
 * upgrades or to the crypto payment request page otherwise.
 */
async function handleCancelAndGoBack(): Promise<void> {
  setLoading(true);

  const result = await cancelPayment(get(upgradeSubId));

  setLoading(false);

  if (!result.ok) {
    setError(t('subscription.error.cancel_failed'), paymentFailureMessage(result.error), CheckoutPaymentMethods.CRYPTO);
    return;
  }

  if (get(upgradeSubId)) {
    await navigateTo({ name: 'home-subscription' });
  }
  else {
    await navigateTo({
      name: 'checkout-pay-request-crypto',
      query: {
        planId: get(planId),
        id: get(subscriptionId),
        discountCode: get(validDiscountCode),
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

onMounted(async () => {
  const success = await initialize();
  set(initialized, true);
  /* Redirect only when there is nothing to show. If initialize() set an error
     (e.g. the crypto payment API returned 400), stay so the user can read it. */
  if (!success && !get(paymentData) && !get(error)) {
    await navigateToProducts();
  }
});
</script>

<template>
  <CryptoSendPage
    v-if="paymentData && selectedPlan"
    v-model:discount-code="modelDiscountCode"
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
    @attempt="clearError()"
  >
    <template #alert>
      <CheckoutAlert
        v-if="error"
        :title="error.title"
        :message="error.message"
        @dismiss="clearError()"
      />
    </template>
  </CryptoSendPage>

  <CryptoPaymentActions
    v-else
    :loading="loading || !initialized"
    :error="error?.message"
    @back="handleCancelAndGoBack()"
  />

  <CheckoutLoadingOverlay :loading="loading" />
</template>

<script setup lang="ts">
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import CheckoutAlert from '@rotki/checkout-ui/components/CheckoutAlert.vue';
import PaymentPage from '@rotki/checkout-ui/components/PaymentPage.vue';
import PolicyConsent from '@rotki/checkout-ui/components/PolicyConsent.vue';
import ProcessingOverlay from '@rotki/checkout-ui/components/ProcessingOverlay.vue';
import { useOrderTotals } from '@rotki/checkout-ui/composables/order-totals';
import { CheckoutPaymentMethods, monthsToPlanDuration, SigilEvents } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import CheckoutLoadingOverlay from '~/modules/checkout/components/common/CheckoutLoadingOverlay.vue';
import OrderSummaryCard from '~/modules/checkout/components/common/OrderSummaryCard.vue';
import ServerErrorOverlay from '~/modules/checkout/components/common/ServerErrorOverlay.vue';
import CheckoutMethodTiles from '~/modules/checkout/components/method/CheckoutMethodTiles.vue';
import { useCheckout } from '~/modules/checkout/composables/use-checkout';
import { purchaseDiscount, useCompletePurchase } from '~/modules/checkout/composables/use-complete-purchase';
import { usePaypalPaymentFlow } from '~/modules/checkout/composables/use-paypal-payment-flow';
import { useSubscriptionIdParam } from '~/modules/checkout/composables/use-plan-params';

const { t } = useI18n({ useScope: 'global' });

const accepted = ref<boolean>(false);
const initializing = ref<boolean>(false);
/** PayPal could not start, so its buttons will not appear. */
const unavailable = ref<boolean>(false);
const submittingPayment = ref<boolean>(false);
const blocked = ref<boolean>(false);

const checkout = useCheckout();
const {
  planId,
  loading: checkoutLoading,
  error,
  clearError,
  setError,
  selectedPlan,
  breakdown,
  isCrypto,
  modelDiscountCode,
  planSwitchLoading,
  braintreeToken,
  validDiscountCode,
  applyDiscount,
  ensureInitialized,
  switchPlan: checkoutSwitchPlan,
} = checkout;

const { upgradeSubId } = useSubscriptionIdParam();
const { chronicle } = useSigilEvents();
const { completePurchase: recordPurchase } = useCompletePurchase();

const {
  paying,
  initializeSdk,
  renderButton,
  updateAmount,
  submitPayment,
} = usePaypalPaymentFlow({
  getTrackingContext: () => ({
    planId: get(planId),
    isUpgrade: !!get(upgradeSubId),
  }),
});

const { summary, total, totalNote } = useOrderTotals({ plan: selectedPlan, breakdown, upgrade: () => !!get(upgradeSubId) });

const renewalNote = computed<string>(() => {
  const info = get(summary);
  const plan = get(selectedPlan);
  if (!info || !plan)
    return '';
  return plan.durationInMonths === 12
    ? t('checkout_paypal.renewal_year', { amount: info.renewal.formatted })
    : t('checkout_paypal.renewal_month', { amount: info.renewal.formatted });
});

const processing = computed<boolean>(() => get(paying) || get(checkoutLoading) || get(planSwitchLoading) || get(blocked));

async function initialize(): Promise<boolean> {
  const hasPlans = await ensureInitialized();
  if (!hasPlans) {
    setError(t('subscription.error.init_error'), t('subscription.error.no_plan_selected'), CheckoutPaymentMethods.PAYPAL);
    return false;
  }

  const token = get(braintreeToken);
  if (!token) {
    setError(t('subscription.error.init_error'), t('subscription.error.payment_init_failed'), CheckoutPaymentMethods.PAYPAL);
    return false;
  }

  const plan = get(selectedPlan);
  const breakdownData = get(breakdown);
  const amount = breakdownData ? Number.parseFloat(breakdownData.finalAmount) : plan?.price ?? 0;

  const result = await initializeSdk(token, amount);
  if (!result.success) {
    setError(t('subscription.error.init_error'), result.error || t('subscription.error.payment_init_failed'), CheckoutPaymentMethods.PAYPAL);
    return false;
  }

  await renderButton({
    callbacks: {
      onPaymentStart: () => {},
      onPaymentSuccess: async (nonce: string) => {
        await handleSubmitPayment(nonce);
      },
      onPaymentError: (errorMsg) => {
        setError(t('subscription.error.payment_failure'), errorMsg, CheckoutPaymentMethods.PAYPAL);
      },
      onPaymentCancel: () => {},
    },
    accepted,
    loading: planSwitchLoading,
  });

  return true;
}

/** Records the purchase for analytics, then moves to the checkout success page. */
async function completePurchase(plan: Pick<SelectedPlan, 'planId' | 'name' | 'durationInMonths'>): Promise<void> {
  const breakdownData = get(breakdown);
  recordPurchase({
    method: 'paypal',
    plan,
    paid: breakdownData?.finalAmount,
    renewingPrice: breakdownData?.renewingPrice,
    upgrade: !!get(upgradeSubId),
    discount: purchaseDiscount(breakdownData?.discount),
  });
  await navigateTo('/checkout/success');
}

async function handleSubmitPayment(nonce: string): Promise<void> {
  const plan = get(selectedPlan);
  if (!plan) {
    setError(t('subscription.error.payment_failure'), 'No plan selected', CheckoutPaymentMethods.PAYPAL);
    return;
  }

  chronicle(SigilEvents.PAYMENT_SUBMITTED, {
    paymentMethod: 'paypal',
    planId: plan.planId,
    planDuration: monthsToPlanDuration(plan.durationInMonths),
    isUpgrade: !!get(upgradeSubId),
    discountApplied: get(breakdown)?.discount?.isValid === true,
  });

  set(submittingPayment, true);
  try {
    const result = await submitPayment(nonce, {
      planId: plan.planId,
      discountCode: get(validDiscountCode),
      upgradeSubId: get(upgradeSubId),
    });

    if (result.success) {
      await completePurchase(plan);
    }
    else if (result.blocked) {
      set(blocked, true);
      setError(
        t('subscription.error.payment_failure'),
        t('subscription.error.server_error_warning'),
        'paypal',
      );
    }
    else {
      setError(t('subscription.error.payment_failure'), result.error || 'Payment failed', CheckoutPaymentMethods.PAYPAL);
    }
  }
  finally {
    set(submittingPayment, false);
  }
}

function reload(): void {
  window.location.reload();
}

async function handlePlanChange(newPlan: SelectedPlan): Promise<void> {
  const success = await checkoutSwitchPlan(newPlan);
  if (!success)
    return;

  const breakdownData = get(breakdown);
  const amount = breakdownData ? Number.parseFloat(breakdownData.finalAmount) : newPlan.price;
  updateAmount(amount);
}

onMounted(async () => {
  set(initializing, true);
  try {
    set(unavailable, !(await initialize()));
  }
  finally {
    set(initializing, false);
  }
});
</script>

<template>
  <PaymentPage
    :total="total"
    :total-note="totalNote"
  >
    <template #alert>
      <!-- A failed PayPal start is explained where its buttons would be. -->
      <CheckoutAlert
        v-if="error && !unavailable"
        :title="error.title"
        :message="error.message"
        @dismiss="clearError()"
      />
    </template>

    <template #methods>
      <CheckoutMethodTiles current="paypal" />
    </template>

    <section
      aria-labelledby="paypal-title"
      class="flex flex-col gap-3 p-4 md:p-6 bg-rui-surface border border-rui-divider rounded-rui-card"
      data-cy="paypal-panel"
    >
      <h2
        id="paypal-title"
        class="text-lg md:text-xl font-semibold text-rui-text"
      >
        {{ t('checkout_paypal.title') }}
      </h2>
      <p class="text-rui-text">
        {{ t('checkout_paypal.approve', { amount: total ?? '' }) }}
      </p>
      <p class="text-sm text-rui-text-secondary">
        {{ renewalNote }}
      </p>
    </section>

    <template #summary>
      <OrderSummaryCard
        v-model:discount-code="modelDiscountCode"
        :selected-plan="selectedPlan"
        :breakdown="breakdown"
        :upgrade-sub-id="upgradeSubId"
        :is-crypto="isCrypto"
        :loading="planSwitchLoading"
        :disabled="planSwitchLoading || paying"
        @plan-change="handlePlanChange($event)"
        @apply-discount="applyDiscount()"
      />
    </template>

    <template #pay>
      <PolicyConsent
        v-model="accepted"
        policy-href="/refund-policy"
        :disabled="processing || initializing"
      />
      <!--
        Holds the space of PayPal's stack while the SDK loads: the PayPal and the debit or credit card
        buttons at 48 px each, then the "Powered by PayPal" line, 138 px in all. The buttons take the
        placeholder's spot and nothing moves.
      -->
      <div class="relative min-h-[138px] mt-2">
        <div
          v-if="unavailable"
          class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center rounded-rui-card border border-dashed border-rui-outline"
          data-cy="paypal-unavailable"
        >
          <p class="text-sm text-rui-text-secondary">
            {{ t('subscription.error.payment_init_failed') }}
          </p>
          <RuiButton
            variant="outlined"
            color="primary"
            @click="reload()"
          >
            {{ t('checkout_paypal.reload') }}
          </RuiButton>
        </div>
        <div
          v-else-if="initializing"
          class="absolute inset-0 flex flex-col items-center gap-4"
          data-cy="paypal-button-loading"
        >
          <RuiSkeletonLoader class="w-full h-12 rounded-rui-control" />
          <RuiSkeletonLoader class="w-full h-12 rounded-rui-control" />
          <RuiSkeletonLoader class="w-36 h-3 mt-1" />
        </div>
        <div
          id="paypal-button"
          class="flex flex-col"
          :class="[
            { 'opacity-50 cursor-not-allowed pointer-events-none': !accepted || processing },
          ]"
        />
      </div>
      <p
        v-if="!unavailable"
        class="hidden lg:block text-sm text-center text-rui-text-secondary"
      >
        {{ t('checkout_paypal.window_hint') }}
      </p>
    </template>
  </PaymentPage>

  <CheckoutLoadingOverlay :loading="checkoutLoading" />

  <ProcessingOverlay :visible="submittingPayment" />

  <ServerErrorOverlay :visible="blocked" />
</template>

<script setup lang="ts">
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { CheckoutPaymentMethods, monthsToPlanDuration, SigilEvents } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import AcceptRefundPolicy from '~/modules/checkout/components/common/AcceptRefundPolicy.vue';
import OrderSummaryCard from '~/modules/checkout/components/common/OrderSummaryCard.vue';
import PaymentLayout from '~/modules/checkout/components/common/PaymentLayout.vue';
import ServerErrorOverlay from '~/modules/checkout/components/common/ServerErrorOverlay.vue';
import { useCheckout } from '~/modules/checkout/composables/use-checkout';
import { usePaypalPaymentFlow } from '~/modules/checkout/composables/use-paypal-payment-flow';
import { useReferralCodeParam, useSubscriptionIdParam } from '~/modules/checkout/composables/use-plan-params';
import { PAYMENT_COMPLETED_KEY } from '~/modules/checkout/constants';
import { buildQueryParams } from '~/utils/query';

const { t } = useI18n({ useScope: 'global' });

const accepted = ref<boolean>(false);
const initializing = ref<boolean>(false);
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
  discountCodeInput,
  planSwitchLoading,
  braintreeToken,
  validDiscountCode,
  applyDiscount,
  ensureInitialized,
  switchPlan: checkoutSwitchPlan,
} = checkout;

const { upgradeSubId } = useSubscriptionIdParam();
const { referralCode } = useReferralCodeParam();
const { chronicle } = useSigilEvents();

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
      const breakdownData = get(breakdown);
      const discountInfo = breakdownData?.discount;
      let discountType: 'discount' | 'referral' | undefined;
      if (discountInfo?.isValid === true) {
        discountType = discountInfo.isReferral ? 'referral' : 'discount';
      }

      chronicle(SigilEvents.PURCHASE_SUCCESS, {
        paymentMethod: 'paypal',
        planId: plan.planId,
        planName: plan.name,
        planDuration: monthsToPlanDuration(plan.durationInMonths),
        revenue: breakdownData?.finalAmount ? Number.parseFloat(breakdownData.finalAmount) : undefined,
        currency: 'EUR',
        isUpgrade: !!get(upgradeSubId),
        discount: discountType,
      });

      sessionStorage.setItem(PAYMENT_COMPLETED_KEY, 'true');
      await navigateTo('/checkout/success');
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

async function handlePlanChange(newPlan: SelectedPlan): Promise<void> {
  const success = await checkoutSwitchPlan(newPlan);
  if (!success)
    return;

  const breakdownData = get(breakdown);
  const amount = breakdownData ? Number.parseFloat(breakdownData.finalAmount) : newPlan.price;
  updateAmount(amount);
}

async function navigateBack(): Promise<void> {
  if (get(upgradeSubId)) {
    await navigateTo({ name: 'home-subscription' });
    return;
  }

  const query = buildQueryParams({
    planId: get(planId),
    ref: get(referralCode),
  });

  await navigateTo({
    name: 'checkout-pay-method',
    query,
  });
}

onMounted(async () => {
  set(initializing, true);
  try {
    await initialize();
  }
  finally {
    set(initializing, false);
  }
});
</script>

<template>
  <PaymentLayout
    :error="error"
    :loading="checkoutLoading"
    @clear-error="clearError()"
  >
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-8 lg:items-start">
      <!-- Main Content (Left Column) -->
      <div class="flex flex-col gap-6 min-w-0">
        <RuiCard class="min-h-64">
          <AcceptRefundPolicy
            v-model="accepted"
            :disabled="processing || initializing"
            class="mb-4"
          />

          <div
            id="paypal-button"
            :class="[
              { 'opacity-50 cursor-not-allowed pointer-events-none': !accepted || processing },
            ]"
          />
        </RuiCard>
      </div>

      <!-- Sidebar (Right Column) -->
      <aside class="w-full lg:sticky lg:top-8 lg:self-start lg:max-w-sm">
        <OrderSummaryCard
          v-model:discount-code="discountCodeInput"
          :selected-plan="selectedPlan"
          :breakdown="breakdown"
          :upgrade-sub-id="upgradeSubId"
          :is-crypto="isCrypto"
          :loading="planSwitchLoading"
          :disabled="planSwitchLoading || paying"
          @plan-change="handlePlanChange($event)"
          @apply-discount="applyDiscount()"
        />
      </aside>
    </div>

    <!-- Action Buttons (Outside Grid) -->
    <div class="flex gap-4 justify-center w-full mt-6 mx-auto max-w-[27.5rem]">
      <RuiButton
        :disabled="processing"
        :loading="paying || initializing"
        class="w-full"
        size="lg"
        @click="navigateBack()"
      >
        <template #prepend>
          <RuiIcon
            name="lu-arrow-left"
            size="16"
          />
        </template>
        {{ t('actions.back') }}
      </RuiButton>
    </div>
  </PaymentLayout>

  <!-- Processing overlay -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-in-out"
      leave-active-class="transition-opacity duration-300 ease-in-out"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      appear
    >
      <div
        v-if="submittingPayment"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <div class="flex flex-col items-center justify-center text-center px-4">
          <div class="mb-4">
            <RuiProgress
              variant="indeterminate"
              size="48"
              circular
              color="primary"
            />
          </div>
          <h3 class="text-lg font-medium text-white mb-1">
            {{ t('subscription.progress.payment_progress') }}
          </h3>
          <p class="text-white/80">
            {{ t('common.please_wait') }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>

  <ServerErrorOverlay :visible="blocked" />
</template>

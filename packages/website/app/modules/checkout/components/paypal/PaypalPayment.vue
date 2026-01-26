<script setup lang="ts">
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get, set } from '@vueuse/shared';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import AcceptRefundPolicy from '~/modules/checkout/components/common/AcceptRefundPolicy.vue';
import OrderSummaryCard from '~/modules/checkout/components/common/OrderSummaryCard.vue';
import PaymentLayout from '~/modules/checkout/components/common/PaymentLayout.vue';
import { useCheckout } from '~/modules/checkout/composables/use-checkout';
import { usePaypalPaymentFlow } from '~/modules/checkout/composables/use-paypal-payment-flow';
import { useReferralCodeParam, useSubscriptionIdParam } from '~/modules/checkout/composables/use-plan-params';
import { buildQueryParams } from '~/utils/query';

const { t } = useI18n({ useScope: 'global' });

const accepted = ref<boolean>(false);
const initializing = ref<boolean>(false);
const submittingPayment = ref<boolean>(false);

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
  appliedDiscountCode,
  applyDiscount,
  ensureInitialized,
  switchPlan: checkoutSwitchPlan,
} = checkout;

const {
  paying,
  initializeSdk,
  renderButton,
  updateAmount,
  submitPayment,
} = usePaypalPaymentFlow();

const { upgradeSubId } = useSubscriptionIdParam();
const { referralCode } = useReferralCodeParam();
const { chronicle } = useSigilEvents();

const processing = computed<boolean>(() => get(paying) || get(checkoutLoading) || get(planSwitchLoading));

async function initialize(): Promise<boolean> {
  const hasPlans = await ensureInitialized();
  if (!hasPlans) {
    setError(t('subscription.error.init_error'), t('subscription.error.no_plan_selected'));
    return false;
  }

  const token = get(braintreeToken);
  if (!token) {
    setError(t('subscription.error.init_error'), t('subscription.error.payment_init_failed'));
    return false;
  }

  const plan = get(selectedPlan);
  const breakdownData = get(breakdown);
  const amount = breakdownData ? Number.parseFloat(breakdownData.finalAmount) : plan?.price ?? 0;

  const result = await initializeSdk(token, amount);
  if (!result.success) {
    setError(t('subscription.error.init_error'), result.error || t('subscription.error.payment_init_failed'));
    return false;
  }

  await renderButton({
    callbacks: {
      onPaymentStart: () => {},
      onPaymentSuccess: async (nonce: string) => {
        await handleSubmitPayment(nonce);
      },
      onPaymentError: (errorMsg) => {
        setError(t('subscription.error.payment_failure'), errorMsg);
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
    setError(t('subscription.error.payment_failure'), 'No plan selected');
    return;
  }

  set(submittingPayment, true);
  try {
    const result = await submitPayment(nonce, {
      planId: plan.planId,
      discountCode: get(appliedDiscountCode) || undefined,
      upgradeSubId: get(upgradeSubId),
    });

    if (result.success) {
      const breakdownData = get(breakdown);
      const discountInfo = breakdownData?.discount;
      const discountType = discountInfo?.isValid === true
        ? (discountInfo.isReferral ? 'referral' : 'discount')
        : undefined;

      chronicle('purchase_success', {
        payment_method: 'paypal',
        plan_id: plan.planId,
        plan_name: plan.name,
        plan_duration: plan.durationInMonths === 1 ? 'monthly' : 'yearly',
        revenue: breakdownData?.finalAmount ? Number.parseFloat(breakdownData.finalAmount) : undefined,
        currency: 'EUR',
        is_upgrade: !!get(upgradeSubId),
        discount: discountType,
      });

      sessionStorage.setItem('payment-completed', 'true');
      await navigateTo('/checkout/success');
    }
    else {
      setError(t('subscription.error.payment_failure'), result.error || 'Payment failed');
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
</template>

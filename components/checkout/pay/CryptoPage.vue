<script lang="ts" setup>
import type { CryptoPayment, IdleStep, PaymentStep, StepType } from '~/types';
import { get, set } from '@vueuse/core';
import { useSelectedPlan } from '~/composables/use-selected-plan';
import { useMainStore } from '~/store';
import { usePaymentCryptoStore } from '~/store/payments/crypto';
import { PaymentError } from '~/types/codes';
import { PaymentMethod } from '~/types/payment';
import { assert } from '~/utils/assert';

const { t } = useI18n({ useScope: 'global' });

const loading = ref<boolean>(false);
const data = ref<CryptoPayment>();
const error = ref<string>('');
const paymentState = ref<StepType | IdleStep>('idle');

const store = useMainStore();
const { refreshUserData } = store;
const { userSubscriptions } = storeToRefs(store);

const { cryptoPayment, switchCryptoPlan, deletePendingCryptoPayment } = usePaymentCryptoStore();

const { currency } = useCurrencyParams();
const { subscriptionId } = useSubscriptionIdParam();
const { discountCode } = useDiscountCodeParams();

const { selectedPlan } = useSelectedPlan();
const { planParams } = usePlanParams();

const step = computed<PaymentStep>(() => {
  const message = get(error);
  const state = get(paymentState);
  if (message) {
    return {
      type: 'failure',
      title: t('subscription.error.payment_failure'),
      message,
      closeable: true,
    };
  }
  else if (state === 'pending') {
    return {
      type: 'pending',
      title: t('subscription.progress.payment_progress'),
      message: t('subscription.progress.payment_progress_message'),
    };
  }
  else if (state === 'success') {
    return { type: 'success' };
  }
  return { type: 'idle' };
});

const currentCryptoSubscriptionId = computed(() => {
  const subs = get(userSubscriptions).filter(sub => sub.pending);

  if (subs.length > 1)
    return subs.find(sub => sub.status === 'Active')?.id;

  return undefined;
});

const usedSubscriptionId = computed(() => get(subscriptionId) ?? get(currentCryptoSubscriptionId));

function back() {
  const id = get(usedSubscriptionId);

  const name = id
    ? 'checkout-pay-request-crypto'
    : 'checkout-pay-method';

  navigateTo({
    name,
    query: {
      ...get(planParams),
      method: PaymentMethod.BLOCKCHAIN,
      id,
    },
  });
}

async function changePaymentMethod() {
  set(loading, true);
  const response = await deletePendingCryptoPayment();

  if (!response.isError) {
    back();
  }
  else {
    set(error, response.error.message);
    set(loading, false);
  }
}

watch([selectedPlan, discountCode], async ([plan, discountCode]) => {
  if (!plan) {
    return;
  }

  const selectedCurrency = get(currency);
  assert(selectedCurrency);
  set(loading, true);

  const response = await switchCryptoPlan(
    plan,
    selectedCurrency,
    get(usedSubscriptionId),
    discountCode,
  );
  if (!response.isError)
    set(data, response.result);
  else
    set(error, response.error.message);

  set(loading, false);
});

onMounted(async () => {
  const selectedPlanVal = get(selectedPlan);
  const selectedCurrency = get(currency);

  if (selectedPlanVal && selectedCurrency) {
    set(loading, true);
    const result = await cryptoPayment(
      selectedPlanVal,
      selectedCurrency,
      get(usedSubscriptionId),
      get(discountCode),
    );

    await refreshUserData();
    if (result.isError) {
      if (result.code === PaymentError.UNVERIFIED)
        set(error, t('subscription.error.unverified_email'));
      else
        set(error, result.error.message);
    }
    else if (result.result.transactionStarted) {
      await navigateTo('/home/subscription');
    }
    else {
      set(data, result.result);
    }

    set(loading, false);
  }
  else {
    await navigateTo('/products');
  }
});
</script>

<template>
  <PaymentFrame :step="step">
    <template #description>
      <CheckoutDescription>
        {{ t('home.plans.tiers.step_3.subtitle') }}
      </CheckoutDescription>
    </template>
    <template #default="{ pending, success, failure, status }">
      <div
        v-if="loading"
        class="flex justify-center my-10"
      >
        <RuiProgress
          variant="indeterminate"
          size="48"
          circular
          color="primary"
        />
      </div>
      <CryptoPaymentForm
        v-else-if="data && selectedPlan"
        v-bind="{ success, failure, status, pending }"
        v-model:error="error"
        v-model:state="paymentState"
        :data="data"
        :loading="loading"
        :plan="selectedPlan"
        :discount-code="discountCode"
        @change="changePaymentMethod()"
      />

      <div
        v-else
        class="flex gap-4 justify-center w-full mt-auto"
      >
        <RuiButton
          class="w-1/2"
          size="lg"
          @click="back()"
        >
          {{ t('actions.back') }}
        </RuiButton>
      </div>
    </template>
  </PaymentFrame>

  <FloatingNotification
    :visible="!(data || loading) && !!step"
    closeable
  >
    <template #title>
      {{ step.title }}
    </template>
    {{ step.message }}
  </FloatingNotification>
</template>

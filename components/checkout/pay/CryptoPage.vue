<script lang="ts" setup>
import type { CryptoPayment, IdleStep, PaymentStep, StepType } from '~/types';
import { get, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useAccountRefresh } from '~/composables/use-app-events';
import { usePaymentApi } from '~/composables/use-payment-api';
import { useMainStore } from '~/store';
import { PaymentError } from '~/types/codes';
import { PaymentMethod } from '~/types/payment';
import { assert } from '~/utils/assert';

const { t } = useI18n({ useScope: 'global' });

const loading = ref<boolean>(false);
const data = ref<CryptoPayment>();
const error = ref<string>('');
const paymentState = ref<StepType | IdleStep>('idle');

const store = useMainStore();
const paymentApi = usePaymentApi();
const { requestRefresh } = useAccountRefresh();
const { subscriptions } = storeToRefs(store);

const { plan } = usePlanParams();
const { currency } = useCurrencyParams();
const { subscriptionId } = useSubscriptionIdParam();
const route = useRoute();

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
  const subs = get(subscriptions).filter(sub => sub.pending);

  if (subs.length > 1)
    return subs.find(sub => sub.status === 'Active')?.identifier;

  return undefined;
});

function back() {
  const { plan, id } = route.query;
  const subId = id ?? get(currentCryptoSubscriptionId);

  const name = subId
    ? 'checkout-pay-request-crypto'
    : 'checkout-pay-method';

  navigateTo({
    name,
    query: {
      plan,
      method: PaymentMethod.BLOCKCHAIN,
      id: subId,
    },
  });
}

async function changePaymentMethod() {
  set(loading, true);
  const response = await paymentApi.deletePendingPayment();

  if (!response.isError) {
    back();
  }
  else {
    set(error, response.error.message);
    set(loading, false);
  }
}

watch(plan, async (plan) => {
  const selectedCurrency = get(currency);
  assert(selectedCurrency);
  set(loading, true);
  const response = await paymentApi.switchCryptoPlan(
    plan,
    selectedCurrency,
    get(subscriptionId) ?? get(currentCryptoSubscriptionId),
  );
  if (!response.isError)
    set(data, response.result);
  else
    set(error, response.error.message);

  set(loading, false);
});

onMounted(async () => {
  const selectedPlan = get(plan);
  const selectedCurrency = get(currency);
  if (selectedPlan && selectedCurrency) {
    set(loading, true);
    const subId = get(subscriptionId);
    const result = await paymentApi.cryptoPayment(selectedPlan, selectedCurrency, subId);
    requestRefresh();
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
  <PaymentFrame
    v-model:step="step"
    :loading="loading"
  >
    <template #description>
      <CheckoutDescription>
        {{ t('home.plans.tiers.step_3.subtitle') }}
      </CheckoutDescription>
    </template>
    <template #default="{ status }">
      <CryptoPaymentForm
        v-if="data && plan"
        v-model:error="error"
        v-model:state="paymentState"
        :status="status"
        :data="data"
        :loading="loading"
        :plan="plan"
        @change="changePaymentMethod()"
      />

      <div
        v-else
        class="flex gap-4 justify-center w-full mt-auto pt-8"
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

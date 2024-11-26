<script lang="ts" setup>
import { useAppKit, useAppKitAccount } from '@reown/appkit/vue';
import { get, set } from '@vueuse/core';
import { useMainStore } from '~/store';
import { PaymentError } from '~/types/codes';
import { PaymentMethod } from '~/types/payment';
import { assert } from '~/utils/assert';
import type { CryptoPayment, PaymentStep } from '~/types';

const { t } = useI18n();

const loading = ref(false);
const data = ref<CryptoPayment>();

const {
  cryptoPayment,
  switchCryptoPlan,
  deletePendingPayment,
  subscriptions,
  getAccount,
} = useMainStore();

const { plan } = usePlanParams();
const { currency } = useCurrencyParams();
const { subscriptionId } = useSubscriptionIdParam();
const route = useRoute();
const { pay, state: currentState, error, clearErrors } = useWeb3Payment(data);
const account = useAppKitAccount();
const { open } = useAppKit();

const step = computed<PaymentStep>(() => {
  const errorMessage = get(error);
  const state = get(currentState);
  if (errorMessage) {
    return {
      type: 'failure',
      title: t('subscription.error.payment_failure'),
      message: errorMessage,
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
  const response = await deletePendingPayment();

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
  const response = await switchCryptoPlan(
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
    const result = await cryptoPayment(selectedPlan, selectedCurrency, subId);
    await getAccount();
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
        v-else-if="data && plan"
        :data="data"
        :pending="pending || currentState === 'pending'"
        v-bind="{ success, failure, status }"
        :loading="loading"
        :plan="plan"
        :connected="account.isConnected"
        @pay="pay()"
        @connect="open()"
        @change="changePaymentMethod()"
        @clear:errors="clearErrors()"
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

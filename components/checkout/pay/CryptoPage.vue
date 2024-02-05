<script lang="ts" setup>
import detectEthereumProvider from '@metamask/detect-provider';
import { get, set } from '@vueuse/core';
import { useMainStore } from '~/store';
import { PaymentError } from '~/types/codes';
import { assert } from '~/utils/assert';
import type { CryptoPayment, PaymentStep, Provider } from '~/types';

const { t } = useI18n();

const loading = ref(false);
const data = ref<CryptoPayment | null>(null);
const metamaskSupport = ref(false);

const { cryptoPayment, switchCryptoPlan } = useMainStore();
const { plan } = usePlanParams();
const { currency } = useCurrencyParams();
const { subscriptionId } = useSubscriptionIdParam();
const route = useRoute();

let provider: Provider | null = null;

onMounted(async () => {
  const selectedPlan = get(plan);
  const selectedCurrency = get(currency);
  if (selectedPlan > 0 && selectedCurrency) {
    provider = await detectEthereumProvider();
    logger.debug(
      `provider: ${!!provider}, is metamask: ${provider?.isMetaMask}`,
    );
    set(metamaskSupport, !!provider);
    set(loading, true);
    const subId = get(subscriptionId);
    const result = await cryptoPayment(selectedPlan, selectedCurrency, subId);
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
      title: t('subscription.error.payment_progress'),
      message: t('subscription.error.payment_progress_message'),
    };
  }
  else if (state === 'success') {
    return {
      type: 'success',
      title: t('subscription.error.transaction_pending'),
      message: t('subscription.error.transaction_pending_message'),
    };
  }
  return { type: 'idle' };
});

function back() {
  const { plan, method } = route.query;
  navigateTo({
    name: 'checkout-pay-method',
    query: {
      plan,
      method,
    },
  });
}

function clear() {
  set(error, null);
  set(currentState, 'idle');
}

const config = useRuntimeConfig();
const {
  payWithMetamask,
  state: currentState,
  error,
} = useWeb3Payment(
  data,
  () => {
    assert(provider);
    return provider;
  },
  !!config.public.testing,
);

watch(plan, async (plan) => {
  const selectedCurrency = get(currency);
  assert(selectedCurrency);
  set(loading, true);
  const response = await switchCryptoPlan(
    plan,
    selectedCurrency,
    get(subscriptionId),
  );
  if (!response.isError)
    set(data, response.result);
  else
    set(error, response.error.message);

  set(loading, false);
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
        :metamask-support="metamaskSupport"
        :plan="plan"
        @pay="payWithMetamask()"
        @clear:errors="clear()"
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

  <FloatingNotification :visible="!(data || loading) && !!step">
    <template #title>
      {{ step.title }}
    </template>
    {{ step.message }}
  </FloatingNotification>
</template>

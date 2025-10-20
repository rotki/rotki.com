<script setup lang="ts">
import type { PaymentStep } from '~/types';
import { get, set } from '@vueuse/core';
import { paypalCheckout } from 'braintree-web';
import { usePaymentPaypalStore } from '~/store/payments/paypal';
import { assert } from '~/utils/assert';
import { useLogger } from '~/utils/use-logger';

interface ErrorMessage {
  title: string;
  message: string;
}

const props = defineProps<{
  status: PaymentStep;
}>();

const { t } = useI18n({ useScope: 'global' });
const { addPaypal, createPaypalNonce } = usePaymentPaypalStore();
const logger = useLogger('paypal-payment');

const { status } = toRefs(props);
const { token, plan, btClient, submit } = useBraintree();

const pending = computed<boolean>(() => get(status).type === 'pending');
const error = ref<ErrorMessage>();
const accepted = ref<boolean>(false);
const paying = ref<boolean>(false);
const initializing = ref<boolean>(false);

const processing = computed<boolean>(() => get(paying) || get(pending));

async function initializePayPal(): Promise<void> {
  const client = get(btClient);
  const currentPlan = get(plan);
  const currentToken = get(token);

  if (!client || !currentPlan || !currentToken) {
    logger.warn('Missing required data for PayPal initialization');
    return;
  }

  function processPayment(months: number, nonce: string): void {
    submit({
      months,
      nonce,
    }).then(async () => {
      sessionStorage.setItem('payment-completed', 'true');
      await navigateTo('/checkout/success');
    }).catch((error_: any) => {
      logger.error('PayPal payment submission failed:', error_);
    });
  }

  let paypalActions: any = null;

  watch(accepted, (isAccepted) => {
    if (isAccepted)
      paypalActions?.enable();
    else
      paypalActions?.disable();
  });

  watch(processing, (isProcessing) => {
    if (isProcessing)
      paypalActions?.disable();
    else
      paypalActions?.enable();
  });

  const btPayPalCheckout = await paypalCheckout.create({
    client,
  });

  await btPayPalCheckout.loadPayPalSDK({
    currency: 'EUR',
    vault: true,
    commit: true,
    intent: 'tokenize',
    components: 'buttons',
  });

  const paypal = window.paypal;
  assert(paypal);

  paypal.Buttons({
    createBillingAgreement: async () => {
      set(paying, true);
      logger.debug(`Creating payment for ${currentPlan.finalPriceInEur} EUR`);
      return await btPayPalCheckout.createPayment({
        flow: 'vault' as any,
        amount: currentPlan.finalPriceInEur,
        currency: 'EUR',
      });
    },
    onApprove: async (data) => {
      set(paying, true);
      logger.debug('User approved PayPal payment');
      const tokenResponse = await btPayPalCheckout.tokenizePayment(data);
      const vaultedToken = await addPaypal({ paymentMethodNonce: tokenResponse.nonce });
      const vaultedNonce = await createPaypalNonce({ paymentToken: vaultedToken });

      processPayment(currentPlan.months, vaultedNonce);

      return tokenResponse;
    },
    onError: (error) => {
      set(paying, false);
      logger.error('PayPal payment failed with error', error);
    },
    onCancel: () => {
      set(paying, false);
      logger.info('PayPal payment was cancelled by user');
    },
    onInit: (_, actions) => {
      paypalActions = actions;
      paypalActions.disable();
    },
  }).render('#paypal-button');
}

async function back(): Promise<void> {
  const currentPlan = get(plan);
  if (!currentPlan)
    return;

  await navigateTo({
    name: 'checkout-pay-method',
    query: {
      plan: currentPlan.months,
    },
  });
}

onMounted(async () => {
  try {
    set(initializing, true);
    await initializePayPal();
    set(initializing, false);
  }
  catch (error_: any) {
    set(error, {
      title: t('subscription.error.init_error'),
      message: error_.message,
    });
  }
});
</script>

<template>
  <div class="my-6 grow flex flex-col">
    <div
      id="paypal-button"
      :class="{
        'opacity-50 cursor-not-allowed pointer-events-none': !accepted || processing,
      }"
    />
    <SelectedPlanOverview
      v-if="plan"
      :plan="plan"
      :disabled="processing || initializing"
    />
    <SubscriptionNotes />
    <AcceptRefundPolicy
      v-model="accepted"
      :disabled="processing || initializing"
      class="my-8"
    />
    <div
      v-if="pending"
      class="my-8"
    >
      <RuiAlert type="info">
        <template #title>
          {{ status?.title }}
        </template>
        <span>{{ status?.message }}</span>
      </RuiAlert>
    </div>
    <div class="flex gap-4 justify-center w-full mt-auto">
      <RuiButton
        :disabled="processing"
        :loading="pending || initializing"
        class="w-1/2"
        size="lg"
        @click="back()"
      >
        {{ t('actions.back') }}
      </RuiButton>
    </div>
  </div>

  <FloatingNotification
    :timeout="10000"
    :visible="!!error"
    closeable
    @dismiss="error = undefined"
  >
    <template #title>
      {{ error?.title }}
    </template>
    {{ error?.message }}
  </FloatingNotification>
</template>

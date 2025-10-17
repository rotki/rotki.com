<script setup lang="ts">
import type { DiscountInfo } from '@rotki/card-payment-common/schemas/discount';
import type { CardPaymentRequest } from '@rotki/card-payment-common/schemas/payment';
import type { PaymentStep } from '~/types';
import { getFinalAmount } from '@rotki/card-payment-common/utils/checkout';
import { get, set } from '@vueuse/core';
import { paypalCheckout } from 'braintree-web';
import { usePaypalApi } from '~/composables/use-paypal-api';
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
const logger = useLogger('paypal-payment');

const { status } = toRefs(props);
const error = ref<ErrorMessage>();
const accepted = ref<boolean>(false);
const paying = ref<boolean>(false);
const initializing = ref<boolean>(false);
const discountCode = ref<string>('');
const discountInfo = ref<DiscountInfo>();

const { addPaypalAccount, createPaypalNonce } = usePaypalApi();
const { token, selectedPlan, btClient, submit, nextPayment, checkoutData } = useBraintree();
const { planId } = usePlanIdParam();
const { upgradeSubId } = useSubscriptionIdParam();

const pending = computed<boolean>(() => get(status).type === 'pending');

const processing = computed<boolean>(() => get(paying) || get(pending));

const grandTotal = computed<number>(() => {
  const data = get(checkoutData);
  const plan = get(selectedPlan);

  if (!data || !plan) {
    return 0;
  }

  return getFinalAmount(data, plan, get(discountInfo));
});

async function processPayment(planId: number, nonce: string): Promise<void> {
  try {
    const discount = get(discountCode);
    const upgradeId = get(upgradeSubId);
    const payload: CardPaymentRequest = {
      planId,
      paymentMethodNonce: nonce,
    };

    if (discount) {
      payload.discountCode = discount;
    }

    if (upgradeId) {
      payload.upgradeSubId = upgradeId;
    }

    await submit(payload);
    sessionStorage.setItem('payment-completed', 'true');
    await navigateTo('/checkout/success');
  }
  catch (error_: any) {
    logger.error('PayPal payment submission failed:', error_);
    set(error, {
      title: t('subscription.error.payment_failure'),
      message: error_.message || t('subscription.error.payment_failure'),
    });
  }
}

async function initializePayPal(): Promise<void> {
  const client = get(btClient);
  const currentPlan = get(selectedPlan);
  const currentToken = get(token);

  if (!client || !currentPlan || !currentToken) {
    logger.warn('Missing required data for PayPal initialization');
    return;
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
      const grandTotalVal = get(grandTotal);
      logger.debug(`Creating payment for ${grandTotalVal} EUR`);
      return await btPayPalCheckout.createPayment({
        flow: 'vault' as any,
        amount: grandTotalVal,
        currency: 'EUR',
      });
    },
    onApprove: async (data) => {
      set(paying, true);
      logger.debug('User approved PayPal payment');
      const tokenResponse = await btPayPalCheckout.tokenizePayment(data);
      const vaultedToken = await addPaypalAccount({ paymentMethodNonce: tokenResponse.nonce });
      const vaultedNonce = await createPaypalNonce({ paymentToken: vaultedToken });
      await processPayment(currentPlan.planId, vaultedNonce);

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

async function navigateBack(): Promise<void> {
  if (get(upgradeSubId)) {
    await navigateTo({
      name: 'home-subscription',
    });
    return;
  }

  const currentPlanId = get(planId);

  if (!currentPlanId) {
    await navigateTo({ name: 'checkout-pay-method' });
    return;
  }

  await navigateTo({
    name: 'checkout-pay-method',
    query: {
      planId: String(currentPlanId),
    },
  });
}

onMounted(async () => {
  try {
    set(initializing, true);
    await initializePayPal();
  }
  catch (error_: any) {
    logger.error('Failed to initialize PayPal:', error_);
    set(error, {
      title: t('subscription.error.init_error'),
      message: error_.message || t('subscription.error.init_error'),
    });
  }
  finally {
    set(initializing, false);
  }
});
</script>

<template>
  <div class="mb-6 grow flex flex-col">
    <SelectedPlanOverview
      v-if="selectedPlan"
      :plan="selectedPlan"
      :upgrade="!!upgradeSubId"
      :next-payment="nextPayment"
      :disabled="processing || initializing"
    />
    <DiscountCodeInput
      v-if="selectedPlan && !upgradeSubId"
      v-model="discountCode"
      v-model:discount-info="discountInfo"
      :plan="selectedPlan"
      class="mt-6"
    />
    <PaymentGrandTotal
      :grand-total="grandTotal"
      :upgrade="!!upgradeSubId"
      class="mt-6"
    />
    <AcceptRefundPolicy
      v-model="accepted"
      :disabled="processing || initializing"
      class="my-8"
    />
    <div
      id="paypal-button"
      class="mb-8"
      :class="[
        { 'opacity-50 cursor-not-allowed pointer-events-none': !accepted || processing },
      ]"
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

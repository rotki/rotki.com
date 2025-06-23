<script setup lang="ts">
import type { Ref } from 'vue';
import type { CardPaymentRequest, PaymentStep, SelectedPlan } from '~/types';
import type { DiscountInfo } from '~/types/payment';
import { get, set } from '@vueuse/core';
import { client, paypalCheckout } from 'braintree-web';
import PaymentGrandTotal from '~/components/checkout/pay/PaymentGrandTotal.vue';
import { usePaymentPaypalStore } from '~/store/payments/paypal';
import { assert } from '~/utils/assert';
import { useLogger } from '~/utils/use-logger';

interface ErrorMessage {
  title: string;
  message: string;
}

const props = defineProps<{
  token: string;
  plan: SelectedPlan;
  success: boolean;
  failure: boolean;
  pending: boolean;
  loading: boolean;
  status: PaymentStep;
  nextPayment: number;
}>();

const emit = defineEmits<{
  (e: 'submit', payment: CardPaymentRequest): void;
  (e: 'update:pending', pending: boolean): void;
  (e: 'clear:errors'): void;
}>();

const { t } = useI18n();

const { token, plan, loading, pending, success, nextPayment } = toRefs(props);
const error = ref<ErrorMessage | null>(null);
const accepted = ref(false);
const mustAcceptRefund = ref(false);
const paying = ref(false);
const initializing = ref(false);
const discountCode = ref('');
const discountInfo = ref<DiscountInfo>();

const { paymentMethodId } = usePaymentMethodParam();
const { addPaypal, createPaypalNonce } = usePaymentPaypalStore();

const { planParams } = usePlanParams();
const { planId } = usePlanIdParam();

const processing = computed(() => get(paying) || get(loading) || get(pending));

let btClient: braintree.Client | null = null;

const logger = useLogger('paypal-payment');

const grandTotal = computed<number>(() => {
  const selectedPlan = get(plan);
  const discountVal = get(discountInfo);
  if (!discountVal || !discountVal.isValid) {
    return selectedPlan.price;
  }

  return discountVal.finalPrice;
});

async function initializeBraintree(token: Ref<string>, plan: Ref<SelectedPlan>, grandTotal: Ref<number>, submit: (plan: CardPaymentRequest) => void) {
  let paypalActions: any = null;

  watch(accepted, (val) => {
    if (val)
      paypalActions?.enable();
    else
      paypalActions?.disable();

    set(mustAcceptRefund, !val);
  });

  watch(processing, (val) => {
    if (val)
      paypalActions?.disable();
    else
      paypalActions?.enable();
  });

  const btClient = await client.create({
    authorization: get(token),
  });

  const btPayPalCheckout = await paypalCheckout.create({
    client: btClient,
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

  paypal
    .Buttons({
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
        logger.debug(`User approved PayPal payment`);
        const token = await btPayPalCheckout.tokenizePayment(data);
        const vaultedToken = await addPaypal({ paymentMethodNonce: token.nonce });
        const vaultedNonce = await createPaypalNonce({ paymentToken: vaultedToken });
        const { durationInMonths, subscriptionTierId } = get(plan);

        submit({
          durationInMonths,
          paymentMethodNonce: vaultedNonce,
          discountCode: get(discountCode) || undefined,
          subscriptionTierId,
        });
        return token;
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
        const userAcceptedPolicy = get(accepted);
        if (!userAcceptedPolicy) {
          assert('disable' in actions && typeof actions.disable === 'function');
          actions.disable();
        }
      },
      onClick: () => {
        if (!get(accepted))
          set(mustAcceptRefund, true);
      },
    })
    .render('#paypal-button');

  return btClient;
}

function clearError() {
  set(error, null);
}

async function back() {
  await navigateTo({
    name: 'checkout-pay-method',
    query: {
      ...get(planParams),
      planId: get(planId),
      method: get(paymentMethodId),
    },
  });
}

const stopWatcher = watchEffect(() => {
  if (get(success))
    redirect();
});

function redirect() {
  navigateTo({ name: 'checkout-success' });
  stopWatcher();
}

onMounted(async () => {
  try {
    set(initializing, true);
    btClient = await initializeBraintree(token, plan, grandTotal, payment => emit('submit', payment));
    set(initializing, false);
  }
  catch (error_: any) {
    set(error, {
      title: t('subscription.error.init_error'),
      message: error_.message,
    });
  }
});

onUnmounted(async () => {
  await btClient?.teardown(() => {});
});
</script>

<template>
  <div class="mb-6 grow flex flex-col">
    <SelectedPlanOverview
      :plan="plan"
      :next-payment="nextPayment"
      :disabled="processing || initializing"
    />
    <DiscountCodeInput
      v-model="discountCode"
      v-model:discount-info="discountInfo"
      :plan="plan"
      class="mt-6"
    />
    <PaymentGrandTotal
      :grand-total="grandTotal"
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
        @click="back()"
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

  <FloatingNotification :visible="mustAcceptRefund">
    <template #title>
      {{ t('policies.refund.accept_title') }}
    </template>
    {{ t('policies.refund.accept_message') }}
  </FloatingNotification>
  <FloatingNotification
    :timeout="10000"
    :visible="!!error"
    closeable
    @dismiss="clearError()"
  >
    <template #title>
      {{ error?.title }}
    </template>
    {{ error?.message }}
  </FloatingNotification>
</template>

<script setup lang="ts">
import { get, set } from '@vueuse/core';
import { client, paypalCheckout } from 'braintree-web';
import { useLogger } from '~/utils/use-logger';
import { usePaymentPaypalStore } from '~/store/payments/paypal';
import { assert } from '~/utils/assert';
import type { Ref } from 'vue';
import type { PaymentStep, SelectedPlan } from '~/types';
import type { PayEvent } from '~/types/common';

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
}>();

const emit = defineEmits<{
  (e: 'pay', plan: PayEvent): void;
  (e: 'update:pending', pending: boolean): void;
  (e: 'clear:errors'): void;
}>();

const { t } = useI18n();
const { paymentMethodId } = usePaymentMethodParam();
const { addPaypal, createPaypalNonce } = usePaymentPaypalStore();

const { token, plan, loading, pending, success } = toRefs(props);
const error = ref<ErrorMessage | null>(null);
const accepted = ref(false);
const mustAcceptRefund = ref(false);
const paying = ref(false);
const initializing = ref(false);

const processing = computed(() => get(paying) || get(loading) || get(pending));

let btClient: braintree.Client | null = null;

const logger = useLogger('paypal-payment');

async function initializeBraintree(token: Ref<string>, plan: Ref<SelectedPlan>, pay: (plan: PayEvent) => void) {
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
        logger.debug(`Creating payment for ${get(plan).finalPriceInEur} EUR`);
        return await btPayPalCheckout.createPayment({
          flow: 'vault' as any,
          amount: get(plan).finalPriceInEur,
          currency: 'EUR',
        });
      },
      onApprove: async (data) => {
        set(paying, true);
        logger.debug(`User approved PayPal payment`);
        const token = await btPayPalCheckout.tokenizePayment(data);
        const vaultedToken = await addPaypal({ paymentMethodNonce: token.nonce });
        const vaultedNonce = await createPaypalNonce({ paymentToken: vaultedToken });
        pay({
          months: get(plan).months,
          nonce: vaultedNonce,
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
      plan: get(plan).months,
      method: get(paymentMethodId),
    },
  });
}

function redirect() {
  navigateTo({ name: 'checkout-success' });
  stopWatcher();
}

const stopWatcher = watchEffect(() => {
  if (get(success))
    redirect();
});

onMounted(async () => {
  try {
    set(initializing, true);
    btClient = await initializeBraintree(token, plan, p => emit('pay', p));
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

const css = useCssModule();
</script>

<template>
  <div class="my-6 grow flex flex-col">
    <div
      id="paypal-button"
      :class="[
        css.buttons,
        { [css.buttons__disabled]: mustAcceptRefund || processing },
      ]"
    />
    <SelectedPlanOverview
      :plan="plan"
      :disabled="processing || initializing"
    />
    <AcceptRefundPolicy
      v-model="accepted"
      :disabled="processing || initializing"
      :class="css.policy"
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
    <div :class="css.button">
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

<style lang="scss" module>
.policy {
  @apply my-8;
}

.buttons {
  &__disabled {
    @apply opacity-50 cursor-not-allowed pointer-events-none;
  }
}

.button {
  @apply flex gap-4 justify-center w-full mt-auto;
}
</style>

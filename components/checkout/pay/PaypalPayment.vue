<script setup lang="ts">
import { client, paypalCheckout } from 'braintree-web';
import { type Ref } from 'vue';
import { type SelectedPlan } from '~/types';
import { assert } from '~/utils/assert';
import { logger } from '~/utils/logger';

const initializeBraintree = async (
  token: Ref<string>,
  plan: Ref<SelectedPlan>,
  accepted: Ref<boolean>,
  mustAcceptRefund: Ref<boolean>,
  pay: (plan: { months: number; nonce: string }) => void
) => {
  let paypalActions: any = null;
  watch(accepted, (accepted) => {
    if (accepted) {
      paypalActions?.enable();
      mustAcceptRefund.value = false;
    } else {
      paypalActions?.disable();
    }
  });
  const btClient = await client.create({
    authorization: token.value,
  });

  const btPaypaylCheckout = await paypalCheckout.create({
    client: btClient,
  });

  await btPaypaylCheckout.loadPayPalSDK({
    currency: 'EUR',
    vault: true,
    commit: true,
    intent: 'tokenize',
  });

  const paypal = window.paypal;
  assert(paypal);

  paypal
    .Buttons({
      createBillingAgreement: () => {
        logger.debug(`Creating payment for ${plan.value.finalPriceInEur} EUR`);
        return btPaypaylCheckout.createPayment({
          flow: 'vault' as any,
          amount: plan.value.finalPriceInEur,
          currency: 'EUR',
        });
      },
      onApprove: async (data) => {
        logger.debug(`User approved PayPal payment`);
        const token = await btPaypaylCheckout.tokenizePayment(data);
        pay({
          months: plan.value.months,
          nonce: token.nonce,
        });
        return token;
      },
      onError: (error) => {
        logger.error('PayPal payment failed with error', error);
      },
      onCancel: () => {
        logger.info('PayPal payment was cancelled by user');
      },
      // @ts-expect-error
      onInit: (_, actions) => {
        paypalActions = actions;
        const userAcceptedPolicy = unref(accepted);
        if (!userAcceptedPolicy) {
          actions.disable();
        }
      },
      onClick: () => {
        if (!unref(accepted)) {
          mustAcceptRefund.value = true;
        }
      },
    })
    .render('#paypal-button');

  return btClient;
};

const props = defineProps<{
  token: string;
  plan: SelectedPlan;
}>();

const emit = defineEmits<{ (e: 'pay', plan: {}): void }>();

const { token, plan } = toRefs(props);
const error = ref('');
const accepted = ref(false);
const mustAcceptRefund = ref(false);

let btClient: braintree.Client | null = null;

onMounted(async () => {
  try {
    btClient = await initializeBraintree(
      token,
      plan,
      accepted,
      mustAcceptRefund,
      (p) => emit('pay', p)
    );
  } catch (e: any) {
    error.value = e.message;
  }
});

onUnmounted(async () => {
  await btClient?.teardown(() => {});
});

const css = useCssModule();
</script>
<template>
  <ErrorDisplay v-if="error" :message="error" title="Initialization Error" />
  <div v-else>
    <div id="paypal-button" :class="css.buttons" />
    <SelectedPlanOverview :plan="plan" />
    <AcceptRefundPolicy v-model="accepted" />
    <ErrorNotification :visible="mustAcceptRefund">
      <template #title> Refund policy </template>
      <template #description>
        You need to accept the refund policy before proceeding
      </template>
    </ErrorNotification>
  </div>
</template>

<style lang="scss" module>
.warning {
  @apply font-medium text-red-600;
}

.buttons {
  min-height: 175px;
}
</style>

<script setup lang="ts">
import {
  type Client,
  type ThreeDSecure,
  client,
  threeDSecure,
} from 'braintree-web';
import { get, set } from '@vueuse/core';
import { useLogger } from '~/utils/use-logger';
import { assert } from '~/utils/assert';
import { usePaymentCardsStore } from '~/store/payments/cards';
import type { PaymentStep, SavedCard, SelectedPlan } from '~/types';
import type { ThreeDSecureVerifyOptions } from 'braintree-web/three-d-secure';
import type { PayEvent } from '~/types/common';

const props = defineProps<{
  token: string;
  plan: SelectedPlan;
  success: boolean;
  failure: boolean;
  pending: boolean;
  status: PaymentStep;
  card: SavedCard | undefined;
}>();

const emit = defineEmits<{
  (e: 'pay', payment: PayEvent): void;
  (e: 'update:pending', pending: boolean): void;
}>();

const { t } = useI18n();
const { paymentMethodId } = usePaymentMethodParam();

interface ErrorMessage {
  title: string;
  message: string;
}

const { token, plan, success, pending, card } = toRefs(props);
const verify = ref(false);
const challengeVisible = ref(false);
const paying = ref(false);
const initializing = ref(true);
const formInitializing = ref(true);

const accepted = ref(false);
const error = ref<ErrorMessage | null>(null);

let btThreeDSecure: ThreeDSecure;

const formValid = ref(false);
const valid = logicAnd(accepted, formValid);

const processing = logicOr(paying, pending);
const disabled = logicOr(processing, initializing, formInitializing, success);

const { addCard, createCardNonce } = usePaymentCardsStore();

const logger = useLogger('card-payment');

function updatePending() {
  emit('update:pending', true);
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

const cardForm = ref();

async function submit() {
  set(paying, true);

  const onClose = () => set(challengeVisible, false);
  const onRender = () => set(challengeVisible, true);

  try {
    const { nonce, bin } = await get(cardForm).submit();

    const savedCard = get(card);

    const paymentToken = savedCard
      ? savedCard.token
      : await addCard({
        paymentMethodNonce: nonce,
      });

    const paymentNonce = await createCardNonce({
      paymentToken,
    });

    const options: ThreeDSecureVerifyOptions = {
      // @ts-expect-error type is missing
      onLookupComplete(_: any, next: any) {
        next();
      },
      removeFrame: () => updatePending(),
      amount: get(plan).finalPriceInEur,
      nonce: paymentNonce,
      bin,
      challengeRequested: true,
    };

    set(verify, true);

    btThreeDSecure.on('authentication-modal-close', onClose);
    btThreeDSecure.on('authentication-modal-render', onRender);

    const payload = await btThreeDSecure.verifyCard(options);
    set(challengeVisible, false);

    const threeDSecureInfo = payload.threeDSecureInfo;
    if (threeDSecureInfo.liabilityShifted) {
      const months = get(plan).months;
      assert(months);
      emit('pay', {
        months,
        nonce: payload.nonce,
      });
    }
    else {
      const status = (threeDSecureInfo as any)?.status as string | undefined;
      set(error, {
        title: t('subscription.error.3d_auth_failed'),
        message: t('subscription.error.3d_auth_failed_message', {
          status: status?.replaceAll('_', ' '),
        }),
      });
      logger.error(`liability did not shift, due to status: ${status}`);
    }
  }
  catch (error_: any) {
    set(error, {
      title: t('subscription.error.payment_error'),
      message: error_.message,
    });
    logger.error(error_);
  }
  finally {
    set(paying, false);
    set(verify, false);
    set(challengeVisible, false);
    btThreeDSecure.off('authentication-modal-close', onClose);
    btThreeDSecure.off('authentication-modal-render', onRender);
  }
}

function clearError() {
  set(error, null);
}

const stopWatcher = watchEffect(() => {
  if (get(success))
    redirect();
});

function redirect() {
  stopWatcher();
  // redirect happens outside of router to force reload for csp.
  const url = new URL(`${window.location.origin}/checkout/success`);
  window.location.href = url.toString();
}

const btClient = ref<Client | null>(null);

onBeforeMount(async () => {
  try {
    set(initializing, true);
    const newClient = await client.create({
      authorization: get(token),
    });
    set(btClient, newClient);

    btThreeDSecure = await threeDSecure.create({
      version: '2',
      client: newClient,
    });
  }
  catch (error_: any) {
    set(error, {
      title: t('subscription.error.init_error'),
      message: error_.message,
    });
  }
  finally {
    set(initializing, false);
  }
});

onUnmounted(() => {
  btThreeDSecure?.teardown();
});

const css = useCssModule();
</script>

<template>
  <div class="my-6 grow flex flex-col">
    <template v-if="btClient">
      <SavedCardDisplay
        v-if="card"
        ref="cardForm"
        :card="card"
        :disabled="disabled"
        :client="btClient"
        @update:form-valid="formValid = $event"
        @update:initializing="formInitializing = $event"
      />
      <CardForm
        v-else
        ref="cardForm"
        v-model:form-valid="formValid"
        v-model:initializing="formInitializing"
        :processing="processing"
        :client="btClient"
        :disabled="disabled"
        @update:error="error = $event"
      />
    </template>
    <div
      v-else
      class="flex justify-center my-10"
    >
      <RuiProgress
        variant="indeterminate"
        size="48"
        circular
        color="primary"
      />
    </div>
    <RuiDivider class="mt-8" />
    <SelectedPlanOverview
      :plan="plan"
      :disabled="disabled"
    />
    <AcceptRefundPolicy
      v-model="accepted"
      :disabled="disabled"
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
    <div :class="css.buttons">
      <RuiButton
        :disabled="processing || success"
        class="w-full"
        size="lg"
        @click="back()"
      >
        {{ t('actions.back') }}
      </RuiButton>
      <RuiButton
        :disabled="!valid"
        :loading="disabled"
        class="w-full"
        color="primary"
        size="lg"
        @click="submit()"
      >
        {{ t('home.plans.tiers.step_3.start') }}
      </RuiButton>
    </div>
  </div>

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

  <FloatingNotification
    :timeout="10000"
    :visible="failure"
  >
    <template #title>
      {{ status?.title }}
    </template>
    {{ status?.message }}
  </FloatingNotification>
</template>

<style lang="scss" module>
.policy {
  @apply my-8;
}

.buttons {
  @apply flex gap-4 justify-center w-full mt-auto;
}
</style>

<script setup lang="ts">
import type { PaymentStep, SavedCard, SelectedPlan } from '~/types';
import type { PayEvent } from '~/types/common';
import { get, set } from '@vueuse/core';
import { type Client, create } from 'braintree-web/client';
import { create as createThreeDSecure, type ThreeDSecure, type ThreeDSecureVerifyOptions } from 'braintree-web/three-d-secure';
import { usePaymentCards } from '~/composables/use-payment-cards';
import { assert } from '~/utils/assert';
import { useLogger } from '~/utils/use-logger';

const props = defineProps<{
  token: string;
  plan: SelectedPlan;
  status: PaymentStep;
  card: SavedCard | undefined;
}>();

const emit = defineEmits<{
  'pay': [payment: PayEvent];
  'update:pending': [pending: boolean];
  'card-deleted': [];
  'card-added': [];
}>();

const { t } = useI18n({ useScope: 'global' });
const { paymentMethodId } = usePaymentMethodParam();

interface ErrorMessage {
  title: string;
  message: string;
}

const { token, plan, status, card } = toRefs(props);

// Derive boolean states from status
const success = computed<boolean>(() => get(status).type === 'success');
const pending = computed<boolean>(() => get(status).type === 'pending');
const verify = ref(false);
const challengeVisible = ref(false);
const paying = ref(false);
const initializing = ref(true);
const formInitializing = ref(true);

const accepted = ref(false);
const error = ref<ErrorMessage | null>(null);

const btClient = ref<Client | null>(null);
const btThreeDSecure = ref<ThreeDSecure | null>(null);

const formValid = ref(false);
const valid = logicAnd(accepted, formValid);

const processing = logicOr(paying, pending);
const disabled = logicOr(processing, initializing, formInitializing, success);

const { addCard, createCardNonce } = usePaymentCards();

const logger = useLogger('card-payment');

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

function updatePending() {
  emit('update:pending', true);
}

async function submit() {
  const threeDSecureInstance = get(btThreeDSecure);
  if (!threeDSecureInstance) {
    set(error, {
      title: t('subscription.error.init_error'),
      message: 'Braintree 3D Secure not initialized',
    });
    return;
  }

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

    // If we just added a new card, emit event to refresh card data
    if (!savedCard) {
      emit('card-added');
    }

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

    threeDSecureInstance.on('authentication-modal-close', onClose);
    threeDSecureInstance.on('authentication-modal-render', onRender);

    const payload = await threeDSecureInstance.verifyCard(options);
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
        title: t('subscription.error.auth_failed_3d_secure'),
        message: t('subscription.error.auth_failed_3d_secure_message', {
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
    threeDSecureInstance.off('authentication-modal-close', onClose);
    threeDSecureInstance.off('authentication-modal-render', onRender);
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

onBeforeMount(async () => {
  try {
    set(initializing, true);
    const newClient = await create({
      authorization: get(token),
    });
    set(btClient, newClient);

    const newThreeDSecure = await createThreeDSecure({
      version: '2',
      client: newClient,
    });
    set(btThreeDSecure, newThreeDSecure);
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
  get(btThreeDSecure)?.teardown();
});
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
        @card-deleted="emit('card-deleted')"
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
      :class="$style.policy"
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
    <div :class="$style.buttons">
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
</template>

<style lang="scss" module>
.policy {
  @apply my-8;
}

.buttons {
  @apply flex gap-4 justify-center w-full mt-auto;
}
</style>

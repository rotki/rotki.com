<script setup lang="ts">
import type { PaymentStep, SavedCard } from '~/types';
import type { PayEvent } from '~/types/common';
import type { ThreeDSecureParams } from '~/types/three-d-secure';
import { get, set } from '@vueuse/core';
import { usePaymentCards } from '~/composables/use-payment-cards';
import { useThreeDSecure } from '~/composables/use-three-d-secure';
import { useLogger } from '~/utils/use-logger';

interface ErrorMessage {
  title: string;
  message: string;
}

const props = defineProps<{
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
const logger = useLogger('card-payment');

const paying = ref<boolean>(false);
const formInitializing = ref<boolean>(true);

const accepted = ref<boolean>(false);
const formValid = ref<boolean>(false);

const error = ref<ErrorMessage>();
const cardForm = ref();

const { status, card } = toRefs(props);
const { token, plan, btClient: client, clientError } = useBraintree();
const pending = computed<boolean>(() => get(status).type === 'pending');

const valid = logicAnd(accepted, formValid);

const processing = logicOr(paying, pending);
const disabled = logicOr(processing, formInitializing);

const { addCard, createCardNonce } = usePaymentCards();
const { navigateToVerification } = useThreeDSecure();

async function back() {
  const currentPlan = get(plan);
  await navigateTo({
    name: 'checkout-pay-method',
    query: {
      plan: currentPlan?.months || '',
    },
  });
}

async function submit() {
  const currentClient = get(client);
  const currentPlan = get(plan);

  if (!currentClient) {
    set(error, {
      title: t('subscription.error.init_error'),
      message: 'Braintree client not initialized',
    });
    return;
  }

  if (!currentPlan) {
    set(error, {
      title: t('subscription.error.init_error'),
      message: 'Plan not available',
    });
    return;
  }

  set(paying, true);

  try {
    const { nonce, bin } = await get(cardForm).submit();

    const savedCard = get(card);

    const paymentToken = savedCard
      ? savedCard.token
      : await addCard({
          paymentMethodNonce: nonce,
        });

    if (!savedCard) {
      emit('card-added');
    }

    const paymentNonce = await createCardNonce({
      paymentToken,
    });

    // Prepare 3D Secure parameters
    const threeDSecureParams: ThreeDSecureParams = {
      token: get(token),
      planMonths: currentPlan.months,
      amount: currentPlan.finalPriceInEur,
      nonce: paymentNonce,
      bin,
    };

    logger.debug('Navigating to 3D Secure verification page');
    await navigateToVerification(threeDSecureParams);
  }
  catch (error_: any) {
    set(error, {
      title: t('subscription.error.payment_error'),
      message: error_.message,
    });
    logger.error('Card payment preparation failed:', error_);
  }
  finally {
    set(paying, false);
  }
}

function clearError() {
  set(error, undefined);
}

watch(clientError, (err) => {
  set(error, {
    title: t('subscription.error.init_error'),
    message: err,
  });
});
</script>

<template>
  <div class="my-6 grow flex flex-col">
    <SavedCardDisplay
      v-if="card"
      ref="cardForm"
      :card="card"
      :disabled="disabled"
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
      :disabled="disabled"
      @update:error="error = $event"
    />
    <RuiDivider class="mt-8" />
    <SelectedPlanOverview
      v-if="plan"
      :plan="plan"
      :disabled="disabled"
    />
    <AcceptRefundPolicy
      v-model="accepted"
      :disabled="disabled"
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

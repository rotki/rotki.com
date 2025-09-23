<script setup lang="ts">
import type { ThreeDSecureVerifyOptions } from 'braintree-web/three-d-secure';
import type {
  CardCheckout,
  CardPaymentRequest,
  PaymentStep,
  SavedCard,
  SelectedPlan,
  UpgradeCardCheckout,
} from '~/types';
import type { DiscountInfo } from '~/types/payment';
import { get, set } from '@vueuse/core';
import {
  type Client,
  client,
  type ThreeDSecure,
  threeDSecure,
} from 'braintree-web';
import CardSelectionDialog from '~/components/checkout/pay/CardSelectionDialog.vue';
import PaymentGrandTotal from '~/components/checkout/pay/PaymentGrandTotal.vue';
import { usePaymentCardsStore } from '~/store/payments/cards';
import { useLogger } from '~/utils/use-logger';

const props = defineProps<{
  token: string;
  plan: SelectedPlan;
  success: boolean;
  failure: boolean;
  pending: boolean;
  status: PaymentStep;
  nextPayment: number;
  card: SavedCard | undefined;
  checkoutData: CardCheckout | UpgradeCardCheckout;
}>();

const emit = defineEmits<{
  (e: 'submit', payment: CardPaymentRequest): void;
  (e: 'update:pending', pending: boolean): void;
}>();

const { t } = useI18n({ useScope: 'global' });
const { paymentMethodId } = usePaymentMethodParam();

interface ErrorMessage {
  title: string;
  message: string;
}

const {
  token,
  plan,
  success,
  pending,
  card,
  checkoutData,
} = toRefs(props);

const verify = ref(false);
const challengeVisible = ref(false);
const paying = ref(false);
const initializing = ref(true);
const formInitializing = ref(true);
const discountCode = ref('');
const discountInfo = ref<DiscountInfo>();

const accepted = ref(false);
const error = ref<ErrorMessage | null>(null);
const formValid = ref(false);
const valid = logicAnd(accepted, formValid);

let btThreeDSecure: ThreeDSecure;

const processing = logicOr(paying, pending);
const disabled = logicOr(processing, initializing, formInitializing, success);

const store = usePaymentCardsStore();
const { addCard, createCardNonce } = store;
const { cards } = storeToRefs(store);
const { planParams } = usePlanParams();
const { planId } = usePlanIdParam();
const { upgradeSubId } = useSubscriptionIdParam();

const logger = useLogger('card-payment');

// Card selection
const selectedCard = ref<SavedCard | undefined>();
const showCardSelectionDialog = ref<boolean>(false);

// Function to find a linked card
function findLinkedCard(): SavedCard | undefined {
  const availableCards = get(cards);
  return availableCards.find(c => c.linked);
}

// Initialize selectedCard with the linked card, or fall back to the default card
watchImmediate([card, cards], () => {
  if (!get(selectedCard)) {
    // First try to find a linked card
    const linkedCard = findLinkedCard();
    if (linkedCard) {
      set(selectedCard, linkedCard);
    }
    // Otherwise use the default card passed as prop
    else if (get(card)) {
      set(selectedCard, get(card));
    }
  }
});

function handleCardSelection(card: SavedCard) {
  set(selectedCard, card);
}

async function handleCardDeleted(deletedCard: SavedCard) {
  // Reload cards from the store to get the updated list
  await store.getCards();

  const currentCards = get(cards);

  // If the deleted card was selected, select another one
  if (get(selectedCard)?.token === deletedCard.token) {
    if (currentCards.length > 0) {
      // First try to select a linked card
      const linkedCard = findLinkedCard();
      if (linkedCard) {
        set(selectedCard, linkedCard);
      }
      else {
        // Otherwise select the first available card
        set(selectedCard, currentCards[0]);
      }
    }
    else {
      // No cards left
      set(selectedCard, undefined);
    }
  }
}

function updatePending() {
  emit('update:pending', true);
}

async function back() {
  if (isDefined(upgradeSubId)) {
    return navigateTo({
      name: 'home-subscription',
    });
  }

  await navigateTo({
    name: 'checkout-pay-method',
    query: {
      ...get(planParams),
      planId: get(planId),
      method: get(paymentMethodId),
    },
  });
}

const cardForm = ref();

const grandTotal = computed<number>(() => {
  const data = get(checkoutData);

  if ('finalAmount' in data) {
    return parseFloat(data.finalAmount);
  }

  const selectedPlan = get(plan);
  const discountVal = get(discountInfo);
  if (!discountVal || !discountVal.isValid) {
    return selectedPlan.price;
  }

  return discountVal.finalPrice;
});

async function submit() {
  set(paying, true);

  const onClose = () => set(challengeVisible, false);
  const onRender = () => set(challengeVisible, true);

  try {
    const { nonce, bin } = await get(cardForm).submit();

    const savedCard = get(selectedCard);

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
      amount: get(grandTotal).toFixed(2),
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
      const { planId } = get(plan);
      emit('submit', {
        discountCode: get(discountCode) || undefined,
        paymentMethodNonce: payload.nonce,
        planId,
        upgradeSubId: get(upgradeSubId),
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
</script>

<template>
  <div class="my-6 grow flex flex-col">
    <template v-if="btClient">
      <div v-if="selectedCard">
        <SavedCardDisplay
          ref="cardForm"
          :card="selectedCard"
          :disabled="disabled"
          :client="btClient"
          :no-delete="isDefined(upgradeSubId)"
          @update:form-valid="formValid = $event"
          @update:initializing="formInitializing = $event"
          @card-deleted="handleCardDeleted($event)"
        />
        <!-- Button to change card -->
        <div class="flex justify-end mt-4">
          <RuiButton
            variant="text"
            size="sm"
            :disabled="disabled"
            @click="showCardSelectionDialog = true"
          >
            <template #prepend>
              <RuiIcon name="lu-credit-card" />
            </template>
            {{
              t('home.plans.tiers.step_3.saved_card.use_other_card', {
                count: cards.length > 1 ? `(${cards.length - 1})` : undefined,
              })
            }}
          </RuiButton>
        </div>
      </div>
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
    <RuiDivider class="mt-6" />
    <UpgradePlanOverview
      v-if="isDefined(upgradeSubId)"
      :next-payment="nextPayment"
      :plan="plan"
    />
    <SelectedPlanOverview
      v-else
      :plan="plan"
      :next-payment="nextPayment"
      :disabled="disabled"
    />
    <DiscountCodeInput
      v-if="!isDefined(upgradeSubId)"
      v-model="discountCode"
      v-model:discount-info="discountInfo"
      :plan="plan"
      class="mt-6"
    />
    <PaymentGrandTotal
      :upgrade="isDefined(upgradeSubId)"
      :grand-total="grandTotal"
      class="mt-6"
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
        <template #prepend>
          <RuiIcon
            name="lu-arrow-left"
            size="16"
          />
        </template>
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

  <CardSelectionDialog
    v-model="showCardSelectionDialog"
    :cards="cards"
    :selected-card="selectedCard"
    @select="handleCardSelection($event)"
  />
</template>

<style lang="scss" module>
.policy {
  @apply my-8;
}

.buttons {
  @apply flex gap-4 justify-center w-full mt-auto;
}
</style>

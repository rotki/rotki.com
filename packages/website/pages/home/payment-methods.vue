<script lang="ts" setup>
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import { PaymentProvider } from '@rotki/card-payment-common/schemas/subscription';
import { get, objectPick, set } from '@vueuse/core';
import AddCardDialog from '~/components/account/home/payment-methods/AddCardDialog.vue';
import DeleteCardDialog from '~/components/account/home/payment-methods/DeleteCardDialog.vue';
import AccountPaymentCard from '~/components/account/home/payment-methods/PaymentCard.vue';
import PaymentCardSkeleton from '~/components/account/home/payment-methods/PaymentCardSkeleton.vue';
import ThreeDSecureModal, { type ThreeDSecureVerificationData } from '~/components/account/home/payment-methods/ThreeDSecureModal.vue';
import { usePaymentCards } from '~/composables/use-payment-cards';
import { useUserSubscriptions } from '~/composables/use-user-subscriptions';
import { useMainStore } from '~/store';
import { useLogger } from '~/utils/use-logger';

interface CardOperation {
  mode: 'default' | 'reauthorize';
  token: string;
}

definePageMeta({
  layout: 'account',
  middleware: ['maintenance', 'authentication'],
});

const { t } = useI18n({ useScope: 'global' });
const logger = useLogger('payment-methods');

const showAddCardDialog = ref<boolean>(false);
const showDeleteDialog = ref<boolean>(false);
const showThreeDSecureModal = ref<boolean>(false);
const isReauthorization = ref<boolean>(false);
const deletingCard = ref<boolean>(false);

const cardOperation = ref<CardOperation>();
const cardToDelete = ref<SavedCard>();
const verificationData = ref<ThreeDSecureVerificationData>();

const error = ref<{ title: string; message: string }>();

const { account } = storeToRefs(useMainStore());

const { cards, loading: cardsLoading, refresh: refreshCards } = usePaymentCards();
const { activeSubscription, loading: subscriptionsLoading, refresh: refreshSubscriptions } = useUserSubscriptions();

const loading = computed<boolean>(() => get(cardsLoading) || get(subscriptionsLoading));
const hasCards = computed<boolean>(() => get(cards).length > 0);
const hasActiveSubscription = computed<boolean>(() => !!get(account)?.hasActiveSubscription);
const hasActiveCryptoSubscription = computed<boolean>(() =>
  get(activeSubscription)?.paymentProvider === PaymentProvider.CRYPTO,
);

function confirmDeleteCard(card: SavedCard): void {
  set(cardToDelete, card);
  set(showDeleteDialog, true);
}

function handleDeleteError(deleteError: { title: string; message: string }): void {
  set(error, deleteError);
}

async function handleDeleteSuccess(): Promise<void> {
  set(cardToDelete, undefined);
  await Promise.all([refreshCards(), refreshSubscriptions()]);
}

async function initiate3DSVerification(card: SavedCard, isReauth: boolean): Promise<void> {
  set(error, undefined);
  set(isReauthorization, isReauth);

  const actionType = isReauth ? 'reauthorization' : 'card verification';
  const mode = isReauth ? 'reauthorize' : 'default';

  try {
    set(cardOperation, { mode, token: card.token });

    const active = get(activeSubscription);

    if (!active) {
      logger.error(`No active subscription found for 3DS ${actionType}`);
      set(error, {
        title: t('common.error'),
        message: t('home.account.payment_methods.no_active_subscription'),
      });
      return;
    }

    // Prevent card operations for crypto subscriptions
    if (active.paymentProvider === PaymentProvider.CRYPTO) {
      logger.error(`Cannot perform ${actionType} on crypto subscription`);
      set(error, {
        title: t('common.error'),
        message: t('home.account.payment_methods.crypto_subscription_no_card_operations'),
      });
      return;
    }

    set(verificationData, {
      cardToken: card.token,
      subscriptionData: objectPick(active, ['nextBillingAmount', 'nextActionDate', 'durationInMonths']),
    });
    set(showThreeDSecureModal, true);
  }
  catch (_error: any) {
    logger.error(`Failed to initialize ${actionType}:`, _error);
    set(error, {
      title: t('common.error'),
      message: _error.message || t('common.error_occurred'),
    });
  }
  finally {
    set(cardOperation, undefined);
  }
}

async function handleSetDefault(card: SavedCard): Promise<void> {
  if (card.linked) {
    return;
  }
  await initiate3DSVerification(card, false);
}

async function handleReauthorize(card: SavedCard): Promise<void> {
  await initiate3DSVerification(card, true);
}

async function handleThreeDSecureSuccess(): Promise<void> {
  set(showThreeDSecureModal, false);
  set(verificationData, undefined);
  await Promise.all([refreshCards(), refreshSubscriptions()]);
}

function handleThreeDSecureError(verifyError: Error): void {
  logger.error('3DS verification failed:', verifyError);
  set(error, {
    title: t('common.error'),
    message: verifyError.message || t('common.error_occurred'),
  });
  set(showThreeDSecureModal, false);
  set(verificationData, undefined);
}

async function handleAddCardSuccess(): Promise<void> {
  await Promise.all([refreshCards(), refreshSubscriptions()]);
}

function isCardLoading(card: SavedCard): boolean {
  const operation = get(cardOperation);
  return operation?.token === card.token && (operation.mode === 'default' || operation.mode === 'reauthorize');
}

function isCardDeleting(card: SavedCard): boolean {
  return get(deletingCard) && get(cardToDelete)?.token === card.token;
}

function getCardTooltip(card: SavedCard): string | undefined {
  if (card.linked) {
    return t('home.account.payment_methods.cannot_delete_linked_card');
  }
  return undefined;
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="text-h6">
          {{ t('home.account.payment_methods.title') }}
        </div>
        <p class="text-rui-text-secondary text-sm">
          {{ t('home.account.payment_methods.subtitle') }}
        </p>
      </div>

      <div>
        <RuiButton
          color="primary"
          @click="showAddCardDialog = true"
        >
          <template #prepend>
            <RuiIcon name="lu-plus" />
          </template>
          {{ t('home.account.payment_methods.add_card') }}
        </RuiButton>
      </div>
    </div>

    <div v-if="loading && !hasCards">
      <div class="flex flex-col gap-2 mb-6">
        <PaymentCardSkeleton />
      </div>
    </div>

    <div
      v-else
      class="relative"
    >
      <!-- Loading overlay for refreshes -->
      <div
        v-if="loading"
        class="absolute inset-0 bg-white/80 dark:bg-rui-grey-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg"
      >
        <RuiProgress
          variant="indeterminate"
          size="48"
          circular
          color="primary"
        />
      </div>
      <RuiAlert
        v-if="error"
        type="error"
        class="mb-6"
        :title="error.title"
        closeable
        @close="error = undefined"
      >
        {{ error.message }}
      </RuiAlert>

      <div
        v-if="hasCards"
        class="flex flex-col gap-2 mb-6"
      >
        <AccountPaymentCard
          v-for="card in cards"
          :key="card.token"
          :card="card"
          :loading="isCardLoading(card)"
          :disabled="!!cardOperation || deletingCard || hasActiveCryptoSubscription"
          :deleting="isCardDeleting(card)"
          :delete-disabled="card.linked"
          :delete-tooltip="getCardTooltip(card)"
          :is-linked="card.linked"
          :show-link-button="hasActiveSubscription && !hasActiveCryptoSubscription"
          @set-default="handleSetDefault(card)"
          @reauthorize="handleReauthorize(card)"
          @delete="confirmDeleteCard(card)"
        />
      </div>

      <div
        v-else
        class="flex flex-col gap-2 items-center text-center py-12"
      >
        <RuiIcon
          name="lu-credit-card"
          size="48"
          class="text-rui-text-disabled mb-4"
        />
        <h3 class="text-xl font-medium">
          {{ t('home.account.payment_methods.no_cards') }}
        </h3>
        <p class="text-rui-text-secondary mb-6">
          {{ t('home.account.payment_methods.no_cards_description') }}
        </p>
      </div>
    </div>

    <DeleteCardDialog
      v-model="showDeleteDialog"
      v-model:deleting="deletingCard"
      :card="cardToDelete"
      @success="handleDeleteSuccess()"
      @error="handleDeleteError($event)"
    />

    <AddCardDialog
      v-model="showAddCardDialog"
      @success="handleAddCardSuccess()"
    />

    <ThreeDSecureModal
      v-if="verificationData"
      v-model="showThreeDSecureModal"
      :verification-data="verificationData"
      :is-reauthorization="isReauthorization"
      @success="handleThreeDSecureSuccess()"
      @error="handleThreeDSecureError($event)"
    />
  </div>
</template>

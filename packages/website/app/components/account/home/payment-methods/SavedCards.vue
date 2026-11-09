<script lang="ts" setup>
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import { PaymentProvider } from '@rotki/card-payment-common/schemas/subscription';
import { get, set } from '@vueuse/shared';
import AccountSection from '~/components/account/home/AccountSection.vue';
import AddCardDialog from '~/components/account/home/payment-methods/AddCardDialog.vue';
import DeleteCardDialog from '~/components/account/home/payment-methods/DeleteCardDialog.vue';
import AccountPaymentCard from '~/components/account/home/payment-methods/PaymentCard.vue';
import PaymentCardSkeleton from '~/components/account/home/payment-methods/PaymentCardSkeleton.vue';
import ThreeDSecureModal from '~/components/account/home/payment-methods/ThreeDSecureModal.vue';
import { type CardVerificationError, CardVerificationMode, useCardVerification } from '~/composables/account/use-card-verification';
import { useUserSubscriptions } from '~/composables/subscription/use-user-subscriptions';
import { useEmailConfirmedCookie } from '~/composables/use-fetch-with-csrf';
import { usePaymentCards } from '~/modules/checkout/composables/use-payment-cards';
import { useMainStore } from '~/store';

const { t } = useI18n({ useScope: 'global' });

const showAddCardDialog = ref<boolean>(false);
const showDeleteDialog = ref<boolean>(false);
const deletingCard = ref<boolean>(false);

const cardToDelete = ref<SavedCard>();

const error = ref<CardVerificationError>();

const { account } = storeToRefs(useMainStore());
const emailConfirmed = useEmailConfirmedCookie();

const { cards, loadFailed: cardsLoadFailed, loading: cardsLoading, refresh: refreshCards } = usePaymentCards();
const { activeSubscription, loading: subscriptionsLoading, refresh: refreshSubscriptions } = useUserSubscriptions();

/** A card change can move which card renews the subscription, so both lists reload. */
async function refreshCardsAndSubscriptions(): Promise<void> {
  await Promise.all([refreshCards(), refreshSubscriptions()]);
}

const {
  handleFailed: handleThreeDSecureError,
  handleVerified: handleThreeDSecureSuccess,
  isReauthorization,
  modelDialogOpen: showThreeDSecureModal,
  start: startVerification,
  verificationData,
  verifyingToken,
} = useCardVerification({
  onError: (verifyError) => {
    set(error, verifyError);
  },
  onVerified: refreshCardsAndSubscriptions,
});

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

function handleDeleteError(deleteError: CardVerificationError): void {
  set(error, deleteError);
}

async function handleDeleteSuccess(): Promise<void> {
  set(cardToDelete, undefined);
  await refreshCardsAndSubscriptions();
}

function handleSetDefault(card: SavedCard): void {
  if (card.linked)
    return;
  set(error, undefined);
  startVerification(card, CardVerificationMode.LINK);
}

function handleReauthorize(card: SavedCard): void {
  set(error, undefined);
  startVerification(card, CardVerificationMode.REAUTHORIZE);
}

function isCardLoading(card: SavedCard): boolean {
  return get(verifyingToken) === card.token;
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
  <AccountSection
    :title="t('account.billing.cards.title')"
    :description="t('account.billing.cards.description')"
  >
    <template #actions>
      <RuiButton
        color="primary"
        variant="outlined"
        :disabled="!emailConfirmed"
        @click="showAddCardDialog = true"
      >
        <template #prepend>
          <RuiIcon
            name="lu-plus"
            size="16"
          />
        </template>
        {{ t('home.account.payment_methods.add_card') }}
      </RuiButton>
    </template>

    <!-- Above the list, so the refresh overlay never covers it -->
    <RuiAlert
      v-if="error"
      type="error"
      class="mb-4"
      :title="error.title"
      closeable
      @close="error = undefined"
    >
      {{ error.message }}
    </RuiAlert>

    <PaymentCardSkeleton v-if="cardsLoading && !hasCards" />

    <div
      v-else
      class="relative"
    >
      <!-- Loading overlay for refreshes -->
      <div
        v-if="loading"
        class="absolute inset-0 bg-white/80 dark:bg-rui-grey-900/80 backdrop-blur-xs z-10 flex items-center justify-center rounded-lg"
      >
        <RuiProgress
          variant="indeterminate"
          size="48"
          circular
          color="primary"
        />
      </div>

      <div
        v-if="hasCards"
        class="flex flex-col gap-2"
      >
        <AccountPaymentCard
          v-for="card in cards"
          :key="card.token"
          :card="card"
          :loading="isCardLoading(card)"
          :disabled="!emailConfirmed || !!verifyingToken || deletingCard || hasActiveCryptoSubscription"
          :deletion="{
            deleting: isCardDeleting(card),
            disabled: card.linked,
            tooltip: getCardTooltip(card),
          }"
          :is-linked="card.linked"
          :show-link-button="hasActiveSubscription && !hasActiveCryptoSubscription"
          @set-default="handleSetDefault(card)"
          @reauthorize="handleReauthorize(card)"
          @delete="confirmDeleteCard(card)"
        />
      </div>

      <div
        v-else-if="cardsLoadFailed"
        class="flex flex-col gap-3 items-center text-center rounded-lg border border-dashed border-default px-4 py-8"
        data-cy="cards-load-failed"
      >
        <p class="max-w-md text-body-2 text-rui-text-secondary text-pretty">
          {{ t('home.account.payment_methods.load_failed') }}
        </p>
        <RuiButton
          color="primary"
          variant="outlined"
          @click="refreshCards()"
        >
          {{ t('actions.try_again') }}
        </RuiButton>
      </div>

      <div
        v-else
        class="flex flex-col gap-2 items-center text-center rounded-lg border border-dashed border-default px-6 py-12"
      >
        <RuiIcon
          name="lu-credit-card"
          size="48"
          class="text-rui-text-disabled mb-2"
        />
        <h3 class="text-h6 text-rui-text">
          {{ t('home.account.payment_methods.no_cards') }}
        </h3>
        <p class="max-w-md text-body-2 text-rui-text-secondary text-pretty">
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
      @success="refreshCardsAndSubscriptions()"
    />

    <ThreeDSecureModal
      v-if="verificationData"
      v-model="showThreeDSecureModal"
      :verification-data="verificationData"
      :is-reauthorization="isReauthorization"
      @success="handleThreeDSecureSuccess()"
      @error="handleThreeDSecureError($event)"
    />
  </AccountSection>
</template>

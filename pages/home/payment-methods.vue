<script lang="ts" setup>
import type { SavedCard as SavedCardType } from '~/types';
import { get, set } from '@vueuse/core';
import AddCardDialog from '~/components/account/AddCardDialog.vue';
import DeleteCardDialog from '~/components/account/DeleteCardDialog.vue';
import AccountPaymentCard from '~/components/account/PaymentCard.vue';
import { usePaymentCardsStore } from '~/store/payments/cards';
import { useLogger } from '~/utils/use-logger';

definePageMeta({
  layout: 'account',
  middleware: ['maintenance', 'authentication'],
});

const { t } = useI18n({ useScope: 'global' });
const logger = useLogger('payment-methods');

const store = usePaymentCardsStore();
const { getCards, setDefaultCard } = store;
const { cards, loading } = storeToRefs(store);

const showAddCardDialog = ref<boolean>(false);
const showDeleteDialog = ref<boolean>(false);
const error = ref<{ title: string; message: string } | null>(null);
const settingDefault = ref<string | null>(null);
const cardToDelete = ref<SavedCardType | null>(null);
const deletingCard = ref<string | null>(null);

async function loadCards() {
  try {
    await getCards();
  }
  catch (error: any) {
    logger.error('Failed to load cards:', error);
  }
}

function confirmDeleteCard(card: SavedCardType) {
  set(cardToDelete, card);
  set(showDeleteDialog, true);
}

function handleDeleteError(deleteError: { title: string; message: string }) {
  set(error, deleteError);
  set(deletingCard, null);
}

function handleDeleteSuccess() {
  set(cardToDelete, null);
  set(deletingCard, null);
  loadCards();
}

async function handleSetDefault(card: SavedCardType) {
  // Don't set if it's already linked
  if (card.linked) {
    return;
  }

  try {
    set(settingDefault, card.token);
    await setDefaultCard(card.token);
  }
  catch (error: any) {
    logger.error('Failed to set default card:', error);
    set(error, {
      title: t('common.error'),
      message: error.message || t('common.error_occurred'),
    });
  }
  finally {
    set(settingDefault, null);
  }
}

onBeforeMount(async () => {
  await loadCards();
});

const hasCards = computed<boolean>(() => get(cards).length > 0);
const hasActiveSubscription = computed<boolean>(() =>
  // Check if any card has linked status
  get(cards).some(card => card.linked),
);

function getCardTooltip(card: SavedCardType): string | undefined {
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

    <div
      v-if="loading && cards.length === 0"
      class="flex justify-center w-full py-12"
    >
      <RuiProgress
        variant="indeterminate"
        size="48"
        circular
        color="primary"
      />
    </div>

    <div v-else>
      <!-- Error Alert -->
      <RuiAlert
        v-if="error"
        type="error"
        class="mb-6"
        :title="error.title"
        :text="error.message"
        closeable
        @close="error = null"
      />

      <!-- Cards List -->
      <div
        v-if="hasCards"
        class="flex flex-col gap-2 mb-6"
      >
        <AccountPaymentCard
          v-for="card in cards"
          :key="card.token"
          :card="card"
          :loading="settingDefault === card.token"
          :disabled="!!settingDefault || !!deletingCard"
          :deleting="deletingCard === card.token"
          :delete-disabled="card.linked"
          :delete-tooltip="getCardTooltip(card)"
          :is-linked="card.linked"
          :show-link-button="hasActiveSubscription"
          @set-default="handleSetDefault(card)"
          @delete="confirmDeleteCard(card)"
        />
      </div>

      <!-- Empty State -->
      <div
        v-if="!hasCards"
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

    <!-- Delete Card Dialog -->
    <DeleteCardDialog
      v-model="showDeleteDialog"
      :card="cardToDelete"
      @update:deleting="deletingCard = $event ? cardToDelete?.token ?? null : null"
      @success="handleDeleteSuccess()"
      @error="handleDeleteError($event)"
    />

    <!-- Add Card Dialog -->
    <AddCardDialog
      v-model="showAddCardDialog"
      @success="loadCards()"
    />
  </div>
</template>

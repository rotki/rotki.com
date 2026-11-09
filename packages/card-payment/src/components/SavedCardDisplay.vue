<script setup lang="ts">
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import { isCardExpired } from '@rotki/card-payment-common/utils/saved-card';
import SavedCardRow from '@rotki/checkout-ui/components/SavedCardRow.vue';
import { useCheckoutMessages } from '@rotki/checkout-ui/composables/checkout-messages';
import { set } from '@vueuse/core';
import { computed, ref } from 'vue';
import { deleteCard } from '@/utils/card-api';
import BaseButton from './BaseButton.vue';
import BaseDialog from './BaseDialog.vue';

interface Props {
  card: SavedCard;
  disabled?: boolean;
}

const { card, disabled = false } = defineProps<Props>();

const emit = defineEmits<{
  'card-deleted': [];
  'error': [message: string];
}>();

const t = useCheckoutMessages();

const showDeleteConfirmation = ref<boolean>(false);
const deletingCard = ref<boolean>(false);

const expired = computed<boolean>(() => isCardExpired(card.expiresAt));

function deleteCardClick(): void {
  set(showDeleteConfirmation, true);
}

async function handleDeleteCard(): Promise<void> {
  set(showDeleteConfirmation, false);
  set(deletingCard, true);

  try {
    await deleteCard(card.token);
    emit('card-deleted');
  }
  catch (error: any) {
    emit('error', error.message || t('checkout.card_page.delete_failed'));
  }
  finally {
    set(deletingCard, false);
  }
}
</script>

<template>
  <div>
    <!-- Saved Card Display -->
    <div class="p-4 flex items-center gap-4 border rounded-md">
      <SavedCardRow :card="card" />
      <BaseButton
        variant="danger-ghost"
        size="icon"
        :disabled="disabled || card.linked"
        :loading="deletingCard"
        :aria-label="t('checkout.card_page.delete_card')"
        :title="card.linked ? t('checkout.card_page.card_linked') : undefined"
        @click="deleteCardClick()"
      >
        <svg
          aria-hidden="true"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </BaseButton>
    </div>

    <!-- Expired Card Error -->
    <div
      v-if="expired"
      class="p-4 bg-red-50 border border-red-200 rounded-sm mb-4"
    >
      <p class="text-red-800 mb-2">
        {{ t('checkout.card_page.card_expired') }}
      </p>
      <p class="text-red-700 text-sm">
        {{ t('checkout.card_page.card_expired_hint') }}
      </p>
    </div>

    <BaseDialog
      v-model:open="showDeleteConfirmation"
      :title="t('checkout.card_page.delete_title')"
    >
      <p class="text-rui-text-secondary">
        {{ t('checkout.card_page.delete_confirm') }}
      </p>
      <template #actions>
        <BaseButton
          variant="ghost"
          @click="showDeleteConfirmation = false"
        >
          {{ t('checkout.card_page.cancel') }}
        </BaseButton>
        <BaseButton
          variant="danger"
          @click="handleDeleteCard()"
        >
          {{ t('checkout.card_page.delete') }}
        </BaseButton>
      </template>
    </BaseDialog>
  </div>
</template>

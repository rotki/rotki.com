<script setup lang="ts">
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import { set } from '@vueuse/core';
import { computed, ref } from 'vue';
import { deleteCard } from '@/utils/card-api';
import BaseButton from './BaseButton.vue';

interface Props {
  card: SavedCard;
  disabled?: boolean;
}

const { card, disabled = false } = defineProps<Props>();

const emit = defineEmits<{
  'card-deleted': [];
  'error': [message: string];
}>();

const showDeleteConfirmation = ref<boolean>(false);
const deletingCard = ref<boolean>(false);

const last4Digits = computed<string>(() => `•••• •••• •••• ${card.last4}`);

const isCardExpired = computed<boolean>(() => {
  const expiryMatch = card.expiresAt.match(/^(\d{2})\/(\d{2,4})$/);
  if (!expiryMatch)
    return true;

  const current = new Date();
  const month = current.getMonth() + 1;
  const year = current.getFullYear();
  const expirationMonth = Number(expiryMatch[1]);
  const yearPart = Number(expiryMatch[2]);
  const expirationYear = yearPart < 100 ? yearPart + 2000 : yearPart;

  return !(expirationYear > year || (expirationYear === year && expirationMonth > month));
});

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
    emit('error', error.message || 'Failed to delete card');
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
      <div class="rounded-md bg-rui-grey-50 h-10 w-14 flex items-center justify-center">
        <img
          :src="card.imageUrl"
          alt="Card image"
          class="w-full h-full object-contain object-center"
        />
      </div>
      <div class="grow">
        <div class="text-rui-text">
          {{ last4Digits }}
        </div>
        <div class="text-sm text-rui-text-secondary">
          Expires {{ card.expiresAt }}
        </div>
      </div>
      <BaseButton
        variant="danger-ghost"
        size="icon"
        :disabled="disabled || card.linked"
        :loading="deletingCard"
        @click="deleteCardClick()"
      >
        <svg
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
      v-if="isCardExpired"
      class="p-4 bg-red-50 border border-red-200 rounded mb-4"
    >
      <p class="text-red-800 mb-2">
        This card has expired
      </p>
      <p class="text-red-700 text-sm">
        Please delete the expired card and add a new one
      </p>
    </div>

    <!-- Delete Card Confirmation Dialog -->
    <div
      v-if="showDeleteConfirmation"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showDeleteConfirmation = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-rui-text mb-4">
          Delete Saved Card
        </h3>
        <p class="text-rui-text-secondary mb-6">
          Are you sure you want to delete this saved card? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-4">
          <BaseButton
            variant="ghost"
            @click="showDeleteConfirmation = false"
          >
            Cancel
          </BaseButton>
          <BaseButton
            variant="danger"
            @click="handleDeleteCard()"
          >
            Delete
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import { set } from '@vueuse/core';
import { computed, ref } from 'vue';
import { deleteCard } from '@/utils/api';

interface Props {
  savedCard: SavedCard;
  disabled?: boolean;
}

const { savedCard, disabled = false } = defineProps<Props>();

const emit = defineEmits<{
  'card-deleted': [];
  'error': [message: string];
}>();

const showDeleteConfirmation = ref<boolean>(false);
const deletingCard = ref<boolean>(false);

const last4Digits = computed<string>(() => `**** **** **** ${savedCard.last4}`);

const isCardExpired = computed<boolean>(() => {
  const expiryMatch = savedCard.expiresAt.match(/^(\d{2})\/(\d{2,4})$/);
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
    await deleteCard(savedCard.token);
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
    <div class="p-4 flex items-center gap-4 border rounded-md mb-4">
      <div class="rounded-md bg-rui-grey-50 h-10 w-14 flex items-center justify-center">
        <img
          :src="savedCard.imageUrl"
          alt="Card image"
          class="w-full h-full object-contain object-center"
        />
      </div>
      <div class="grow">
        <div class="text-rui-text">
          {{ last4Digits }}
        </div>
        <div class="text-sm text-rui-text-secondary">
          Expires {{ savedCard.expiresAt }}
        </div>
      </div>
      <button
        type="button"
        class="w-10 h-10 relative flex items-center justify-center gap-2 text-base font-medium leading-[1.625rem] outline-1 outline-offset-[-1px] outline-transparent rounded border-0 p-0 transition-all duration-150 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="disabled || deletingCard"
        @click="deleteCardClick()"
      >
        <svg
          v-if="!deletingCard"
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
        <svg
          v-else
          class="animate-spin w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </button>
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
          <button
            type="button"
            class="relative flex items-center justify-center gap-2 text-base font-medium leading-[1.625rem] outline-1 outline-offset-[-1px] outline-transparent rounded border-0 px-6 py-2 transition-all duration-150 bg-white text-rui-primary hover:bg-rui-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="showDeleteConfirmation = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="relative flex items-center justify-center gap-2 text-base font-medium leading-[1.625rem] outline-1 outline-offset-[-1px] outline-transparent rounded border-0 px-6 py-2 transition-all duration-150 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleDeleteCard()"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

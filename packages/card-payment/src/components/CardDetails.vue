<script setup lang="ts">
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { Client } from 'braintree-web/client';
import type { TokenizedCard } from '@/composables/card-checkout';
import CheckoutPanel from '@rotki/checkout-ui/components/CheckoutPanel.vue';
import HostedCardForm from '@rotki/checkout-ui/components/HostedCardForm.vue';
import { get } from '@vueuse/core';
import { ref, useTemplateRef } from 'vue';
import { useSavedCardSelection } from '@/composables/saved-card-selection';
import { cardFieldsFor } from '@/utils/hosted-fields';
import AddCardDialog from './AddCardDialog.vue';
import CardSelectionDialog from './CardSelectionDialog.vue';
import SavedCardDisplay from './SavedCardDisplay.vue';

const selectedCard = defineModel<SavedCard | undefined>('selectedCard', { required: true });

const { client, cards, disabled = false } = defineProps<{
  /** Braintree client; the new card form waits for it. */
  client?: Client;
  /** `undefined` while the saved cards load; the form waits so it does not flash before a saved card. */
  cards?: SavedCard[];
  disabled?: boolean;
}>();

const emit = defineEmits<{
  /** Whether the new card form is complete; a saved card needs no form. */
  'validation-change': [valid: boolean];
  'error': [message: string];
  /** A card was added or deleted, so the saved card list is stale. */
  'refresh-card': [];
}>();

const showCardSelection = ref<boolean>(false);
const showAddCard = ref<boolean>(false);
const newCardForm = useTemplateRef<InstanceType<typeof HostedCardForm>>('newCardForm');

const { selectWhenAdded } = useSavedCardSelection(selectedCard, () => cards ?? []);

function handleCardAdded(token: string): void {
  selectWhenAdded(token);
  emit('refresh-card');
}

/** Tokenizes the new card form; `undefined` when a saved card is shown instead. */
async function tokenize(): Promise<TokenizedCard | undefined> {
  return get(newCardForm)?.tokenize();
}

defineExpose({ tokenize });
</script>

<template>
  <CheckoutPanel
    labelled-by="card-details-title"
    data-testid="card-details"
  >
    <h2
      id="card-details-title"
      class="text-lg md:text-xl font-semibold text-rui-text"
    >
      Card details
    </h2>

    <!-- Holds the new card form's height, so the saved cards, the form and the placeholder swap without moving the page. -->
    <div class="flex flex-col gap-4 min-h-[8.5rem]">
      <div
        v-if="!cards"
        aria-hidden="true"
        class="grid grid-cols-2 gap-4 animate-pulse"
        data-testid="card-details-loading"
      >
        <div
          v-for="(span, index) in ['col-span-2', '', '']"
          :key="index"
          :class="span"
        >
          <div class="h-4 w-24 mt-0.5 mb-1.5 rounded bg-rui-surface-muted" />
          <div class="h-9 rounded-rui-control bg-rui-surface-muted" />
        </div>
      </div>

      <template v-else-if="selectedCard">
        <SavedCardDisplay
          :card="selectedCard"
          :disabled="disabled"
          @card-deleted="emit('refresh-card')"
          @error="emit('error', $event)"
        />
        <button
          type="button"
          :disabled="disabled"
          class="self-start text-sm font-medium text-rui-primary hover:underline underline-offset-2 disabled:opacity-50"
          data-testid="use-other-card"
          @click="showCardSelection = true"
        >
          Use another card{{ cards.length > 1 ? ` (${cards.length - 1} saved)` : '' }}
        </button>
      </template>

      <HostedCardForm
        v-else-if="client"
        ref="newCardForm"
        :create-fields="cardFieldsFor(client)"
        :disabled="disabled"
        @validation-change="emit('validation-change', $event)"
        @error="emit('error', $event)"
      />
    </div>

    <p class="flex gap-2 text-sm text-rui-text-secondary">
      <svg
        aria-hidden="true"
        class="size-4 mt-0.5 shrink-0"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <rect
          height="10"
          rx="2"
          width="16"
          x="4"
          y="11"
        />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
      Processed by Braintree, a PayPal service. rotki never sees or stores your card number.
    </p>

    <CardSelectionDialog
      v-model:open="showCardSelection"
      :cards="cards ?? []"
      :selected-card="selectedCard"
      :disabled="disabled"
      @select-card="selectedCard = $event"
      @add-new-card="showAddCard = true"
    />

    <AddCardDialog
      v-model:open="showAddCard"
      :client="client"
      @card-added="handleCardAdded($event)"
      @refresh-card="emit('refresh-card')"
    />
  </CheckoutPanel>
</template>

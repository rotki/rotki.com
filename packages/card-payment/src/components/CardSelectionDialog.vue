<script setup lang="ts">
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import { useCheckoutMessages } from '@rotki/checkout-ui/composables/checkout-messages';
import { set } from '@vueuse/core';
import BaseButton from './BaseButton.vue';
import BaseDialog from './BaseDialog.vue';
import SavedCardListItem from './SavedCardListItem.vue';

const open = defineModel<boolean>('open', { required: true });

const { cards, selectedCard, disabled = false } = defineProps<{
  cards: SavedCard[];
  selectedCard?: SavedCard;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'select-card': [card: SavedCard];
  'add-new-card': [];
}>();

const t = useCheckoutMessages();

function handleSelectCard(card: SavedCard): void {
  emit('select-card', card);
  set(open, false);
}

function handleAddNewCard(): void {
  set(open, false);
  emit('add-new-card');
}
</script>

<template>
  <BaseDialog
    v-model:open="open"
    :title="t('checkout.card_page.select_card')"
  >
    <div class="space-y-3">
      <SavedCardListItem
        v-for="card in cards"
        :key="card.token"
        :card="card"
        :selected="selectedCard?.token === card.token"
        :disabled="disabled"
        @select="handleSelectCard(card)"
      />
    </div>

    <template #actions>
      <BaseButton
        variant="primary"
        size="sm"
        @click="handleAddNewCard()"
      >
        {{ t('checkout.card_page.add_new_card') }}
      </BaseButton>
      <BaseButton
        variant="ghost"
        size="sm"
        @click="open = false"
      >
        {{ t('checkout.card_page.cancel') }}
      </BaseButton>
    </template>
  </BaseDialog>
</template>

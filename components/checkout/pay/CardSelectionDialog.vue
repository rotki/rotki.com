<script lang="ts" setup>
import type { SavedCard } from '~/types';
import { get, set } from '@vueuse/core';
import AddCardDialog from '~/components/account/AddCardDialog.vue';
import AccountPaymentCard from '~/components/account/PaymentCard.vue';

interface Props {
  cards: SavedCard[];
  selectedCard: SavedCard | undefined;
}

const showDialog = defineModel<boolean>({ required: true });

const props = defineProps<Props>();

const emit = defineEmits<{
  'select': [card: SavedCard];
  'cards-updated': [];
}>();

const { t } = useI18n({ useScope: 'global' });

const internalSelectedCard = ref<SavedCard | undefined>(props.selectedCard);
const showAddCardDialog = ref<boolean>(false);

watch(() => props.selectedCard, (newCard) => {
  set(internalSelectedCard, newCard);
});

function selectCard(card: SavedCard) {
  set(internalSelectedCard, card);
}

function handleConfirm() {
  if (get(internalSelectedCard)) {
    emit('select', get(internalSelectedCard)!);
    set(showDialog, false);
  }
}

function handleCancel() {
  set(internalSelectedCard, props.selectedCard);
  set(showDialog, false);
}

function handleAddCard() {
  set(showAddCardDialog, true);
}

function handleCardAdded() {
  emit('cards-updated');
}
</script>

<template>
  <RuiDialog
    v-model="showDialog"
    max-width="600"
  >
    <RuiCard>
      <template #header>
        {{ t('home.plans.tiers.step_3.saved_card.select_card') }}
      </template>

      <div class="space-y-3">
        <AccountPaymentCard
          v-for="card in cards"
          :key="card.token"
          :card="card"
          :selectable="true"
          :selected="internalSelectedCard?.token === card.token"
          :hide-actions="true"
          @select="selectCard(card)"
        />
      </div>

      <template #footer>
        <div class="w-full flex gap-3">
          <RuiButton
            color="primary"
            variant="outlined"
            @click="handleAddCard()"
          >
            <template #prepend>
              <RuiIcon
                name="lu-plus"
                size="16"
              />
            </template>
            {{ t('payment_methods.add_new_card') }}
          </RuiButton>
          <div class="grow" />
          <RuiButton
            variant="text"
            @click="handleCancel()"
          >
            {{ t('actions.cancel') }}
          </RuiButton>
          <RuiButton
            color="primary"
            :disabled="!internalSelectedCard"
            @click="handleConfirm()"
          >
            {{ t('actions.confirm') }}
          </RuiButton>
        </div>
      </template>
    </RuiCard>
  </RuiDialog>

  <!-- Add Card Dialog -->
  <AddCardDialog
    v-model="showAddCardDialog"
    @success="handleCardAdded()"
  />
</template>

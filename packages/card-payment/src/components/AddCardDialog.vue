<script setup lang="ts">
import type { Client } from 'braintree-web/client';
import { get, set } from '@vueuse/core';
import { ref } from 'vue';
import { addCard } from '@/utils/api';
import BaseButton from './BaseButton.vue';
import BaseDialog from './BaseDialog.vue';
import NewCardForm from './NewCardForm.vue';

const open = defineModel<boolean>('open', { required: true });

const { client } = defineProps<{
  client?: Client;
}>();

const emit = defineEmits<{
  'card-added': [token: string];
  'error': [message: string];
}>();

const addCardForm = ref<InstanceType<typeof NewCardForm>>();
const addCardFormValid = ref<boolean>(false);
const isAddingCard = ref<boolean>(false);

async function handleAddCard(): Promise<void> {
  if (!get(addCardFormValid)) {
    return;
  }

  set(isAddingCard, true);

  try {
    const form = get(addCardForm);
    if (!form) {
      emit('error', 'Add card form not available');
      set(isAddingCard, false);
      return;
    }

    const { nonce } = await form.tokenize();
    const newCardToken = await addCard({
      paymentMethodNonce: nonce,
    });

    emit('card-added', newCardToken);
    set(open, false);
  }
  catch (error: any) {
    emit('error', error.message || 'Failed to add card');
  }
  finally {
    set(isAddingCard, false);
  }
}
</script>

<template>
  <BaseDialog
    v-model:open="open"
    title="Add New Card"
  >
    <NewCardForm
      v-if="client"
      ref="addCardForm"
      :client="client"
      :disabled="isAddingCard"
      @validation-change="addCardFormValid = $event"
      @error="emit('error', $event)"
    />

    <template #actions>
      <BaseButton
        variant="ghost"
        size="sm"
        :disabled="isAddingCard"
        @click="open = false"
      >
        Cancel
      </BaseButton>
      <BaseButton
        variant="primary"
        size="sm"
        :disabled="!addCardFormValid"
        :loading="isAddingCard"
        @click="handleAddCard()"
      >
        {{ isAddingCard ? 'Adding...' : 'Add Card' }}
      </BaseButton>
    </template>
  </BaseDialog>
</template>

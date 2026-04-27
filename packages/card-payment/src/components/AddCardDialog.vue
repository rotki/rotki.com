<script setup lang="ts">
import type { Client } from 'braintree-web/client';
import { get, set } from '@vueuse/core';
import { ref, useTemplateRef, watch } from 'vue';
import { addCard } from '@/utils/card-api';
import BaseButton from './BaseButton.vue';
import BaseDialog from './BaseDialog.vue';
import NewCardForm from './NewCardForm.vue';

const open = defineModel<boolean>('open', { required: true });

const { client } = defineProps<{
  client?: Client;
}>();

const emit = defineEmits<{
  'card-added': [token: string];
}>();

const addCardFormValid = ref<boolean>(false);
const isAddingCard = ref<boolean>(false);
const addCardError = ref<string>();
const addCardForm = useTemplateRef<InstanceType<typeof NewCardForm>>('addCardForm');

async function handleAddCard(): Promise<void> {
  if (!get(addCardFormValid)) {
    return;
  }

  set(isAddingCard, true);
  set(addCardError, undefined);

  try {
    const form = get(addCardForm);
    if (!form) {
      set(addCardError, 'Add card form not available');
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
  catch (caughtError: any) {
    set(addCardError, caughtError.message || 'Failed to add card');
  }
  finally {
    set(isAddingCard, false);
  }
}

// Reset the inline error each time the dialog is reopened so a stale alert
// from a prior attempt doesn't persist across sessions.
watch(open, (isOpen) => {
  if (isOpen) {
    set(addCardError, undefined);
  }
});
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
      @error="addCardError = $event"
    />

    <div
      v-if="addCardError"
      class="mt-4 flex items-start gap-3 rounded-md border border-rui-error/30 bg-rui-error/10 p-3 text-sm text-rui-error"
      role="alert"
    >
      <svg
        class="h-5 w-5 shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span class="flex-1">{{ addCardError }}</span>
    </div>

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

<script setup lang="ts">
import type { Client } from 'braintree-web/client';
import CheckoutAlert from '@rotki/checkout-ui/components/CheckoutAlert.vue';
import HostedCardForm from '@rotki/checkout-ui/components/HostedCardForm.vue';
import { useCheckoutMessages } from '@rotki/checkout-ui/composables/checkout-messages';
import { get, set } from '@vueuse/core';
import { ref, useTemplateRef, watch } from 'vue';
import { addCard, CardAddedPaymentError } from '@/utils/card-api';
import { cardFieldsFor } from '@/utils/hosted-fields';
import { userPaymentMessage } from '@/utils/payment-error';
import BaseButton from './BaseButton.vue';
import BaseDialog from './BaseDialog.vue';

const open = defineModel<boolean>('open', { required: true });

const { client } = defineProps<{
  client?: Client;
}>();

const emit = defineEmits<{
  'card-added': [token: string];
  'refresh-card': [];
}>();

const t = useCheckoutMessages();

const addCardFormValid = ref<boolean>(false);
const isAddingCard = ref<boolean>(false);
const addCardError = ref<string>();
const addCardForm = useTemplateRef<InstanceType<typeof HostedCardForm>>('addCardForm');

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
  catch (caughtError: unknown) {
    if (caughtError instanceof CardAddedPaymentError) {
      emit('refresh-card');
    }
    set(addCardError, userPaymentMessage(caughtError, 'card'));
  }
  finally {
    set(isAddingCard, false);
  }
}

// Clear the inline error on reopen so a stale alert from a prior attempt doesn't persist.
watch(open, (isOpen) => {
  if (isOpen) {
    set(addCardError, undefined);
  }
});
</script>

<template>
  <BaseDialog
    v-model:open="open"
    :title="t('checkout.card_page.add_card_title')"
  >
    <HostedCardForm
      v-if="client"
      ref="addCardForm"
      :create-fields="cardFieldsFor(client)"
      :disabled="isAddingCard"
      @validation-change="addCardFormValid = $event"
      @error="addCardError = $event"
    />

    <CheckoutAlert
      v-if="addCardError"
      class="mt-4"
      :message="addCardError"
      @dismiss="addCardError = ''"
    />

    <template #actions>
      <BaseButton
        variant="ghost"
        size="sm"
        :disabled="isAddingCard"
        @click="open = false"
      >
        {{ t('checkout.card_page.cancel') }}
      </BaseButton>
      <BaseButton
        variant="primary"
        size="sm"
        :disabled="!addCardFormValid"
        :loading="isAddingCard"
        @click="handleAddCard()"
      >
        {{ isAddingCard ? t('checkout.card_page.adding_card') : t('checkout.card_page.add_card') }}
      </BaseButton>
    </template>
  </BaseDialog>
</template>

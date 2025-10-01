<script lang="ts" setup>
import { get, set } from '@vueuse/core';
import { type Client, create } from 'braintree-web/client';
import { ref } from 'vue';
import CardForm from '~/components/account/home/payment-methods/CardForm.vue';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useLogger } from '~/utils/use-logger';

const showDialog = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  success: [];
}>();

const { t } = useI18n({ useScope: 'global' });
const logger = useLogger('add-card-dialog');
const { fetchWithCsrf } = useFetchWithCsrf();

const { addCard } = usePaymentCards();

const client = ref<Client>();
const isProcessing = ref<boolean>(false);
const cardFormValid = ref<boolean>(false);
const error = ref<{ title: string; message: string } | null>(null);

const cardForm = ref<InstanceType<typeof CardForm>>();

const isFormValid = logicAnd(cardFormValid, logicNot(isProcessing));

// Initialize Braintree client when dialog opens
async function initializeBraintreeClient() {
  if (get(client)) {
    return;
  }

  try {
    const tokenResponse = await fetchWithCsrf<{ braintreeClientToken: string }>(
      '/webapi/2/braintree/customer',
      {
        method: 'GET',
      },
    );

    set(client, await create({
      authorization: tokenResponse.braintreeClientToken,
    }));
  }
  catch (error: any) {
    logger.error('Failed to initialize Braintree:', error);
    set(error, {
      title: t('subscription.error.init_error'),
      message: error.message,
    });
  }
}

async function handleAddCard() {
  if (!get(cardForm) || !get(isFormValid)) {
    return;
  }

  try {
    set(isProcessing, true);
    const form = get(cardForm);
    if (!form) {
      throw new Error('New card form not available');
    }
    set(error, null);

    const { nonce } = await form.tokenize();

    await addCard({
      paymentMethodNonce: nonce,
    });

    set(showDialog, false);
    emit('success');

    // Reset form state
    set(error, null);
  }
  catch (error: any) {
    logger.error('Failed to add card:', error);
    set(error, {
      title: t('common.error'),
      message: error.message || t('common.error_occurred'),
    });
  }
  finally {
    set(isProcessing, false);
  }
}

function handleCancel() {
  set(showDialog, false);
  set(error, null);
  set(cardFormValid, false);
}

// Initialize Braintree when dialog opens
watch(showDialog, async (isOpen) => {
  if (isOpen) {
    set(error, null);
    set(cardFormValid, false);
    await initializeBraintreeClient();
  }
});
</script>

<template>
  <RuiDialog
    v-model="showDialog"
    max-width="600"
  >
    <RuiCard>
      <template #header>
        {{ t('home.account.payment_methods.add_card') }}
      </template>

      <!-- Error Alert -->
      <RuiAlert
        v-if="error"
        type="error"
        class="mb-4"
        :title="error.title"
        :text="error.message"
        closeable
        @close="error = null"
      />

      <!-- Card Form -->
      <CardForm
        v-if="client"
        ref="cardForm"
        :client="client"
        :disabled="isProcessing"
        @update:error="error = $event"
        @validation-change="cardFormValid = $event"
      />

      <!-- Loading State -->
      <div
        v-if="!client"
        class="flex justify-center py-8"
      >
        <RuiProgress
          variant="indeterminate"
          size="48"
          circular
          color="primary"
        />
      </div>

      <template #footer>
        <div class="w-full flex justify-end gap-3">
          <RuiButton
            variant="text"
            :disabled="isProcessing"
            @click="handleCancel()"
          >
            {{ t('actions.cancel') }}
          </RuiButton>
          <RuiButton
            color="primary"
            :loading="isProcessing"
            :disabled="!isFormValid"
            @click="handleAddCard()"
          >
            {{ t('actions.add_card') }}
          </RuiButton>
        </div>
      </template>
    </RuiCard>
  </RuiDialog>
</template>

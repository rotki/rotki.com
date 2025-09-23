<script lang="ts" setup>
import { get, set } from '@vueuse/core';
import { client, type Client } from 'braintree-web';
import CardForm from '~/components/checkout/pay/CardForm.vue';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { usePaymentCardsStore } from '~/store/payments/cards';
import { useLogger } from '~/utils/use-logger';

const showDialog = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  success: [];
}>();

const { t } = useI18n({ useScope: 'global' });
const logger = useLogger('add-card-dialog');
const { fetchWithCsrf } = useFetchWithCsrf();

const { addCard } = usePaymentCardsStore();

const btClient = ref<Client>();
const initializing = ref<boolean>(false);
const formValid = ref<boolean>(false);
const processing = ref<boolean>(false);
const error = ref<{ title: string; message: string } | null>(null);

const cardFormRef = ref<InstanceType<typeof CardForm>>();

// Initialize Braintree client when dialog opens
async function initializeBraintree() {
  if (get(btClient)) {
    return;
  }

  try {
    set(initializing, true);
    const tokenResponse = await fetchWithCsrf<{ braintreeClientToken: string }>(
      '/webapi/2/braintree/customer',
      {
        method: 'GET',
      },
    );

    set(btClient, await client.create({
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
  finally {
    set(initializing, false);
  }
}

async function handleAddCard() {
  if (!get(cardFormRef) || !get(formValid)) {
    return;
  }

  try {
    set(processing, true);
    set(error, null);

    const { nonce } = await get(cardFormRef)!.submit();

    await addCard({
      paymentMethodNonce: nonce,
    });

    set(showDialog, false);
    emit('success');

    // Reset form state
    set(formValid, false);
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
    set(processing, false);
  }
}

function handleCancel() {
  set(showDialog, false);
  set(error, null);
  set(formValid, false);
}

const disableForm = computed<boolean>(() => get(processing) || get(initializing));

// Initialize Braintree when dialog opens
watch(showDialog, async (isOpen) => {
  if (isOpen) {
    set(error, null);
    set(formValid, false);
    await initializeBraintree();
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
        v-if="btClient"
        ref="cardFormRef"
        :client="btClient"
        :disabled="disableForm"
        :processing="processing"
        @update:error="error = $event"
        @update:form-valid="formValid = $event"
        @update:initializing="initializing = $event"
      />

      <!-- Loading State -->
      <div
        v-if="!btClient && initializing"
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
            :disabled="processing"
            @click="handleCancel()"
          >
            {{ t('actions.cancel') }}
          </RuiButton>
          <RuiButton
            color="primary"
            :loading="processing"
            :disabled="!formValid || initializing"
            @click="handleAddCard()"
          >
            {{ t('actions.add_card') }}
          </RuiButton>
        </div>
      </template>
    </RuiCard>
  </RuiDialog>
</template>

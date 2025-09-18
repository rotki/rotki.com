<script setup lang="ts">
import type { CheckoutData, SavedCardType } from '@/types';
import { get, set } from '@vueuse/core';
import { type Client, create } from 'braintree-web/client';
import { create as createVaultManager, type VaultManager } from 'braintree-web/vault-manager';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { addCard, createCardNonce } from '@/utils/api';
import NewCardForm from './NewCardForm.vue';
import PaymentButtons from './PaymentButtons.vue';
import PlanSummary from './PlanSummary.vue';
import SavedCardDisplay from './SavedCardDisplay.vue';
import TermsAcceptance from './TermsAcceptance.vue';

const error = defineModel<string>('error', { required: true });
const savedCard = defineModel<SavedCardType | undefined>('savedCard', { required: true });

const { planData } = defineProps<{
  planData: CheckoutData;
}>();

const emit = defineEmits<{
  'go-back': [];
  'payment-success': [];
  'refresh-card': [];
}>();

const client = ref<Client>();
const newCardForm = ref<InstanceType<typeof NewCardForm>>();
const isProcessing = ref<boolean>(false);
const acceptedTerms = ref<boolean>(false);
const newCardFormValid = ref<boolean>(false);

const isFormValid = computed<boolean>(() => {
  const card = get(savedCard);
  const hasAcceptedTerms = get(acceptedTerms);
  const notProcessing = !get(isProcessing);

  if (card) {
    return hasAcceptedTerms && notProcessing;
  }

  return (
    get(newCardFormValid) &&
    hasAcceptedTerms &&
    notProcessing
  );
});

// Initialize Braintree client
async function initializeBraintreeClient(): Promise<void> {
  try {
    client.value = await create({
      authorization: planData.braintreeClientToken,
    });
  }
  catch (error: any) {
    set(error, `Failed to initialize payment client: ${error.message}`);
    console.error(error);
  }
}

async function getSavedCardBin(card: SavedCardType): Promise<string> {
  let vaultManager: VaultManager | null = null;

  try {
    vaultManager = await createVaultManager({
      client: client.value,
    });

    const methods = await vaultManager.fetchPaymentMethods();
    const method = methods.find(({ type, details }) =>
      type === 'CreditCard' &&
      details &&
      'lastFour' in details &&
      details?.lastFour === card.last4,
    );

    if (method?.details && 'bin' in method.details && method.details.bin) {
      return method.details.bin;
    }

    return '';
  }
  catch (error) {
    console.error('Failed to fetch bin from vault manager:', error);
    return '';
  }
  finally {
    if (vaultManager) {
      await vaultManager.teardown();
    }
  }
}

async function processPayment(): Promise<void> {
  if (!get(isFormValid)) {
    return;
  }

  set(isProcessing, true);
  set(error, '');

  try {
    const card = get(savedCard);

    let paymentToken: string;
    let paymentBin: string;

    if (card) {
      paymentBin = await getSavedCardBin(card);
      paymentToken = card.token;
    }
    else {
      const form = get(newCardForm);
      if (!form) {
        throw new Error('New card form not available');
      }

      const { nonce, bin } = await form.tokenize();
      paymentBin = bin;
      paymentToken = await addCard({
        paymentMethodNonce: nonce,
      });

      emit('refresh-card');
    }

    const paymentNonce = await createCardNonce({
      paymentToken,
    });

    // Store data for 3D Secure if needed
    const threeDSecureParams = {
      token: planData.braintreeClientToken,
      planMonths: planData.months,
      amount: planData.finalPriceInEur,
      nonce: paymentNonce,
      bin: paymentBin,
    };

    sessionStorage.setItem('threeDSecureData', JSON.stringify(threeDSecureParams));
    emit('payment-success');
  }
  catch (error: any) {
    set(error, error.message || 'Payment failed. Please try again.');
    set(isProcessing, false);
  }
}

function handleCardDeleted(): void {
  emit('refresh-card');
}

onMounted(async () => {
  await initializeBraintreeClient();
});

onUnmounted(async () => {
  try {
    await client.value?.teardown(() => {});
  }
  catch (error) {
    console.error('Error during cleanup:', error);
  }
});
</script>

<template>
  <div class="flex flex-col w-full max-w-[29rem] mx-auto mt-8 lg:mt-0 grow">
    <!-- Title -->
    <h4 class="font-bold text-h4 text-rui-text text-center mb-3">
      Payment Details
    </h4>
    <div class="text-body-1 text-center text-rui-text-secondary mb-6">
      Payments are safely processed with Braintree a PayPal Service
    </div>

    <!-- Payment Form -->
    <div class="my-6 grow flex flex-col">
      <!-- Saved Card Display -->
      <SavedCardDisplay
        v-if="savedCard"
        :saved-card="savedCard"
        :disabled="isProcessing"
        @card-deleted="handleCardDeleted()"
        @error="error = $event"
      />

      <!-- New Card Form (only show if no saved card) -->
      <NewCardForm
        v-else-if="client"
        ref="newCardForm"
        :client="client"
        :disabled="isProcessing"
        @validation-change="newCardFormValid = $event"
        @error="error = $event"
      />

      <!-- Divider -->
      <hr class="my-8 border-rui-grey-300" />

      <!-- Plan Summary -->
      <PlanSummary :plan-data="planData" />

      <!-- Accept Refund Policy -->
      <TermsAcceptance
        v-model:accepted-terms="acceptedTerms"
        :disabled="isProcessing"
      />

      <!-- Pending Payment Message -->
      <div
        v-if="isProcessing"
        class="my-8"
      >
        <div class="p-4 bg-blue-50 border border-blue-200 rounded">
          <p class="text-blue-800">
            Processing payment, please wait...
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <PaymentButtons
        :disabled="!isFormValid"
        :processing="isProcessing"
        @go-back="emit('go-back')"
        @continue="processPayment()"
      />
    </div>
  </div>
</template>

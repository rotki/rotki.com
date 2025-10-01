<script setup lang="ts">
import type { CheckoutData, UpgradeData } from '@rotki/card-payment-common/schemas/checkout';
import type { DiscountInfo } from '@rotki/card-payment-common/schemas/discount';
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { ThreeDSecureParams } from '@rotki/card-payment-common/schemas/three-d-secure';
import { get, set } from '@vueuse/core';
import { type Client, create } from 'braintree-web/client';
import { create as createVaultManager, type VaultManager } from 'braintree-web/vault-manager';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { addCard, createCardNonce } from '@/utils/api';
import BaseButton from './BaseButton.vue';
import DiscountCodeInput from './DiscountCodeInput.vue';
import NewCardForm from './NewCardForm.vue';
import PaymentButtons from './PaymentButtons.vue';
import PaymentGrandTotal from './PaymentGrandTotal.vue';
import PlanSummary from './PlanSummary.vue';
import SavedCardDisplay from './SavedCardDisplay.vue';
import TermsAcceptance from './TermsAcceptance.vue';

const error = defineModel<string>('error', { required: true });
const selectedCard = defineModel<SavedCard | undefined>('selectedCard', { required: true });

const { planData, selectedPlan, upgradeSubId, cards } = defineProps<{
  planData: CheckoutData | UpgradeData;
  selectedPlan: SelectedPlan;
  upgradeSubId: string | null;
  cards: SavedCard[];
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
const showCardSelectionDialog = ref<boolean>(false);
const showAddCardDialog = ref<boolean>(false);
const addCardForm = ref<InstanceType<typeof NewCardForm>>();
const addCardFormValid = ref<boolean>(false);
const isAddingCard = ref<boolean>(false);
const pendingCardToken = ref<string>();

// Discount state
const discountCode = ref<string>('');
const discountInfo = ref<DiscountInfo>();

const isFormValid = computed<boolean>(() => {
  const card = get(selectedCard);
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

async function getSavedCardBin(card: SavedCard): Promise<string> {
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

const finalAmount = computed<number>(() => {
  const data = get(planData);

  if ('finalAmount' in data) {
    return parseFloat(data.finalAmount);
  }

  const plan = get(selectedPlan);
  const discountVal = get(discountInfo);
  if (discountVal && discountVal.isValid && discountVal.finalPrice) {
    return discountVal.finalPrice;
  }

  return plan.price;
});

async function processPayment(): Promise<void> {
  if (!get(isFormValid)) {
    return;
  }

  set(isProcessing, true);
  set(error, '');

  try {
    const card = get(selectedCard);

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
    const threeDSecureParams: ThreeDSecureParams = {
      token: planData.braintreeClientToken,
      planId: selectedPlan.planId,
      amount: get(finalAmount).toString(),
      nonce: paymentNonce,
      bin: paymentBin,
      discountCode: get(discountCode) || undefined,
      upgradeSubId: get(upgradeSubId) || undefined,
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

async function handleAddCard(): Promise<void> {
  if (!get(addCardFormValid)) {
    return;
  }

  set(isAddingCard, true);
  set(error, '');

  try {
    const form = get(addCardForm);
    if (!form) {
      throw new Error('Add card form not available');
    }

    const { nonce } = await form.tokenize();
    const newCardToken = await addCard({
      paymentMethodNonce: nonce,
    });

    set(pendingCardToken, newCardToken);
    emit('refresh-card');
    set(showAddCardDialog, false);
  }
  catch (error: any) {
    set(error, error.message || 'Failed to add card');
  }
  finally {
    set(isAddingCard, false);
  }
}

// Watch for cards changes to select newly added card
watch(() => cards, (newCards) => {
  const token = get(pendingCardToken);
  if (token) {
    const newCard = newCards.find(card => card.token === token);
    if (newCard) {
      set(selectedCard, newCard);
      set(pendingCardToken, undefined);
    }
  }
});

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
      <div v-if="selectedCard">
        <SavedCardDisplay
          :card="selectedCard"
          :disabled="isProcessing"
          @card-deleted="handleCardDeleted()"
          @error="error = $event"
        />

        <!-- Button to change card -->
        <div class="flex justify-end mt-4">
          <button
            :disabled="isProcessing"
            class="text-sm text-neutral-500 hover:bg-neutral-100 px-1.5 py-0.5 rounded-md hover:underline"
            @click="showCardSelectionDialog = true"
          >
            Use other cards {{ cards.length > 1 ? `(${cards.length - 1})` : undefined }}
          </button>
        </div>
      </div>

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
      <hr class="my-6 border-rui-grey-300" />

      <!-- Plan Summary -->
      <PlanSummary
        :upgrade="!!upgradeSubId"
        :selected-plan="selectedPlan"
        :next-payment="planData.nextPayment"
      />

      <!-- Discount Code Input -->
      <DiscountCodeInput
        v-if="!upgradeSubId"
        v-model="discountCode"
        v-model:discount-info="discountInfo"
        class="mt-6"
        :selected-plan="selectedPlan"
      />

      <!-- Payment Grand Total -->
      <PaymentGrandTotal
        class="mt-6"
        :upgrade="!!upgradeSubId"
        :plan-data="planData"
        :selected-plan="selectedPlan"
        :discount-info="discountInfo"
      />

      <!-- Accept Refund Policy -->
      <TermsAcceptance
        v-model:accepted-terms="acceptedTerms"
        :disabled="isProcessing"
      />

      <!-- Pending Payment Message -->
      <div
        v-if="isProcessing"
        class="my-4"
      >
        <div class="p-4 bg-orange-50 border border-orange-200 rounded-md text-orange-800 text-sm">
          Processing payment, please wait...
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

    <!-- Card Selection Modal -->
    <div
      v-if="showCardSelectionDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showCardSelectionDialog = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-rui-text mb-4">
          Select a Card
        </h3>
        <div class="space-y-3 mb-6">
          <button
            v-for="card in cards"
            :key="card.token"
            type="button"
            class="w-full p-4 flex items-center gap-4 border rounded-md transition-all hover:border-rui-primary"
            :class="selectedCard?.token === card.token ? 'border-rui-primary bg-rui-primary/5' : 'border-rui-grey-300'"
            @click="selectedCard = card; showCardSelectionDialog = false"
          >
            <div class="rounded-md bg-rui-grey-50 h-10 w-14 flex items-center justify-center">
              <img
                :src="card.imageUrl"
                alt="Card image"
                class="w-full h-full object-contain object-center"
              />
            </div>
            <div class="grow text-left">
              <div class="text-rui-text">
                •••• •••• •••• {{ card.last4 }}
              </div>
              <div class="text-sm text-rui-text-secondary">
                Expires {{ card.expiresAt }}
              </div>
            </div>
            <svg
              v-if="selectedCard?.token === card.token"
              class="w-5 h-5 text-rui-primary"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div class="flex justify-between">
          <BaseButton
            variant="primary"
            size="sm"
            @click="showCardSelectionDialog = false; showAddCardDialog = true"
          >
            Add new card
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="showCardSelectionDialog = false"
          >
            Cancel
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Add Card Modal -->
    <div
      v-if="showAddCardDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showAddCardDialog = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-rui-text mb-4">
          Add New Card
        </h3>
        <div class="mb-6">
          <NewCardForm
            v-if="client"
            ref="addCardForm"
            :client="client"
            :disabled="isAddingCard"
            @validation-change="addCardFormValid = $event"
            @error="error = $event"
          />
        </div>
        <div class="flex justify-end gap-4">
          <BaseButton
            variant="ghost"
            size="sm"
            :disabled="isAddingCard"
            @click="showAddCardDialog = false"
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
        </div>
      </div>
    </div>
  </div>
</template>

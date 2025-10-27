<script setup lang="ts">
import type { CheckoutData, UpgradeData } from '@rotki/card-payment-common/schemas/checkout';
import type { DiscountInfo } from '@rotki/card-payment-common/schemas/discount';
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { ThreeDSecureParams } from '@rotki/card-payment-common/schemas/three-d-secure';
import { getFinalAmount } from '@rotki/card-payment-common/utils/checkout';
import { get, set } from '@vueuse/core';
import { type Client, create } from 'braintree-web/client';
import { create as createVaultManager, type VaultManager } from 'braintree-web/vault-manager';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { addCard, createCardNonce } from '@/utils/api';
import AddCardDialog from './AddCardDialog.vue';
import CardSelectionDialog from './CardSelectionDialog.vue';
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

const finalAmount = computed<number>(() =>
  getFinalAmount(get(planData), get(selectedPlan), get(discountInfo)),
);

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
        set(error, 'New card form not available');
        set(isProcessing, false);
        return;
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
    const plan = get(selectedPlan);
    const threeDSecureParams: ThreeDSecureParams = {
      token: planData.braintreeClientToken,
      planId: selectedPlan.planId,
      amount: plan.price.toString(),
      finalAmount: get(finalAmount).toString(),
      nonce: paymentNonce,
      bin: paymentBin,
      discountCode: get(discountCode) || undefined,
      upgradeSubId: get(upgradeSubId) || undefined,
      durationInMonths: plan.durationInMonths,
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

function handleCardAdded(token: string): void {
  set(pendingCardToken, token);
  emit('refresh-card');
}

function handleSelectCard(card: SavedCard): void {
  set(selectedCard, card);
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
  <div class="flex flex-col w-full max-w-7xl mx-auto grow">
    <!-- Title -->
    <div class="mb-6">
      <h4 class="font-bold text-h4 text-rui-text mb-3">
        Payment Details
      </h4>
      <div class="text-body-1 text-rui-text-secondary">
        Payments are safely processed with Braintree a PayPal Service
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr] xl:gap-8 xl:items-start">
      <!-- Left Column: Payment Form -->
      <div class="flex flex-col gap-6 min-w-0">
        <!-- Card Input Section -->
        <div class="bg-white rounded-lg border border-rui-grey-300 p-6">
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
        </div>
      </div>

      <!-- Right Column: Order Summary -->
      <aside class="w-full xl:sticky xl:top-8 xl:self-start">
        <div class="bg-white rounded-lg border border-rui-grey-300 p-6">
          <div class="text-lg font-medium mb-4">
            Order Summary
          </div>

          <!-- Plan Summary -->
          <PlanSummary
            :upgrade="!!upgradeSubId"
            :selected-plan="selectedPlan"
            :next-payment="planData.nextPayment"
          />

          <hr class="my-4 border-rui-grey-300" />

          <!-- Discount Code Input -->
          <DiscountCodeInput
            v-if="!upgradeSubId"
            v-model="discountCode"
            v-model:discount-info="discountInfo"
            :selected-plan="selectedPlan"
            class="mb-4"
          />

          <!-- Payment Grand Total -->
          <PaymentGrandTotal
            :upgrade="!!upgradeSubId"
            :plan-data="planData"
            :selected-plan="selectedPlan"
            :discount-info="discountInfo"
          />
        </div>
      </aside>
    </div>

    <!-- Accept Refund Policy (Outside Grid) -->
    <TermsAcceptance
      v-model:accepted-terms="acceptedTerms"
      :disabled="isProcessing"
      class="max-w-[27.5rem] mx-auto w-full"
    />

    <!-- Pending Payment Message (Outside Grid) -->
    <div
      v-if="isProcessing"
      class="mb-8 max-w-[27.5rem] mx-auto w-full"
    >
      <div class="p-4 bg-orange-50 border border-orange-200 rounded-md text-orange-800 text-sm">
        Processing payment, please wait...
      </div>
    </div>

    <!-- Action Buttons (Outside Grid) -->
    <div class="max-w-[27.5rem] mx-auto w-full">
      <PaymentButtons
        :disabled="!isFormValid"
        :processing="isProcessing"
        @go-back="emit('go-back')"
        @continue="processPayment()"
      />
    </div>

    <!-- Card Selection Dialog -->
    <CardSelectionDialog
      v-model:open="showCardSelectionDialog"
      :cards="cards"
      :selected-card="selectedCard"
      :disabled="isProcessing"
      @select-card="handleSelectCard($event)"
      @add-new-card="showAddCardDialog = true"
    />

    <!-- Add Card Dialog -->
    <AddCardDialog
      v-model:open="showAddCardDialog"
      :client="client"
      @card-added="handleCardAdded($event)"
      @error="error = $event"
    />
  </div>
</template>

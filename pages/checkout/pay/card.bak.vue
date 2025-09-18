<script setup lang="ts">
import type { SavedCard } from '~/types';
import { navigateTo, useAsyncData, useHead } from '#app';
import { definePageMeta, useRuntimeConfig } from '#imports';
import { get, set } from '@vueuse/core';
import { create } from 'braintree-web/client';
import { create as createHostedFields, type HostedFields } from 'braintree-web/hosted-fields';
import { create as createVaultManager, type VaultManager } from 'braintree-web/vault-manager';
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useAccountApi } from '~/composables/use-account-api';
import { usePaymentApi } from '~/composables/use-payment-api';
import { usePaymentCards } from '~/composables/use-payment-cards';
import { canBuyNewSubscription } from '~/utils/subscription';

definePageMeta({
  layout: 'minimal',
});

useHead({
  title: 'Pay with Card - rotki',
  meta: [{
    name: 'description',
    content: 'Complete your rotki premium subscription payment',
  }],
});

const config = useRuntimeConfig();

if (config.public.maintenance) {
  await navigateTo('/maintenance');
}

const accountApi = useAccountApi();
const userAccount = await accountApi.getAccount();
if (!userAccount || !userAccount.emailConfirmed || !canBuyNewSubscription(userAccount)) {
  await navigateTo('/home/subscription');
}

const route = useRoute();
const paymentApi = usePaymentApi();
const planId = parseInt(route.query.plan as string);
const data = await paymentApi.checkout(planId);

if (data.isError) {
  throw new Error('Failed to load checkout data');
}

const planData = data.result;
const clientToken = planData.braintreeClientToken;
const newClient = await create({
  authorization: clientToken,
});

const { t } = useI18n({ useScope: 'global' });

// Initialize saved card functionality
const { getCard, deleteCard, createCardNonce, addCard } = usePaymentCards();
const { data: savedCard, refresh: refreshSavedCard } = await useAsyncData(
  'saved-card',
  async () => await getCard(),
  {
    default: () => undefined,
  },
);

const showDeleteConfirmation = ref<boolean>(false);
const deletingCard = ref<boolean>(false);

const planMonths = computed(() => route.query.plan as string || '12');

const hostedFields = ref<HostedFields>();
const hostedFieldsInitializing = ref<boolean>(false);
const focusedField = ref<string>('');

interface FieldState {
  valid: boolean;
  touched: boolean;
  hasContent: boolean;
}

const fieldStates = reactive(new Map<string, FieldState>([
  ['number', { valid: false, touched: false, hasContent: false }],
  ['expirationDate', { valid: false, touched: false, hasContent: false }],
  ['cvv', { valid: false, touched: false, hasContent: false }],
]));

function updateFieldState(field: string, updates: Partial<FieldState>): void {
  const current = fieldStates.get(field);
  if (current) {
    fieldStates.set(field, { ...current, ...updates });
  }
}

const fieldErrors = computed(() => ({
  number: fieldStates.get('number')?.touched && !fieldStates.get('number')?.valid,
  expirationDate: fieldStates.get('expirationDate')?.touched && !fieldStates.get('expirationDate')?.valid,
  cvv: fieldStates.get('cvv')?.touched && !fieldStates.get('cvv')?.valid,
}));

const fieldContent = computed(() => ({
  number: fieldStates.get('number')?.hasContent ?? false,
  expirationDate: fieldStates.get('expirationDate')?.hasContent ?? false,
  cvv: fieldStates.get('cvv')?.hasContent ?? false,
}));

const newCardFormValid = computed<boolean>(() => {
  const numberValid = fieldStates.get('number')?.valid ?? false;
  const expiryValid = fieldStates.get('expirationDate')?.valid ?? false;
  const cvvValid = fieldStates.get('cvv')?.valid ?? false;
  return numberValid && expiryValid && cvvValid;
});

const isProcessing = ref<boolean>(false);
const acceptedTerms = ref<boolean>(false);
const generalError = ref<string>('');

const isCardExpired = computed<boolean>(() => {
  const card = get(savedCard);
  if (!card)
    return false;

  const expiryMatch = card.expiresAt.match(/^(\d{2})\/(\d{2,4})$/);
  if (!expiryMatch)
    return true;

  const current = new Date();
  const month = current.getMonth() + 1;
  const year = current.getFullYear();
  const expirationMonth = Number(expiryMatch[1]);
  const yearPart = Number(expiryMatch[2]);
  const expirationYear = yearPart < 100 ? yearPart + 2000 : yearPart;

  return !(expirationYear > year || (expirationYear === year && expirationMonth > month));
});

const isFormValid = computed<boolean>(() => {
  const card = get(savedCard);
  const hasAcceptedTerms = get(acceptedTerms);
  const notProcessing = !get(isProcessing);
  const cardNotExpired = !get(isCardExpired);

  if (card) {
    return hasAcceptedTerms && notProcessing && cardNotExpired;
  }

  return (
    get(newCardFormValid) &&
    hasAcceptedTerms &&
    notProcessing
  );
});

async function initializeHostedFields(): Promise<void> {
  if (get(hostedFields)) {
    return;
  }

  set(hostedFieldsInitializing, true);

  try {
    const fieldsInstance = await createHostedFields({
      client: newClient,
      styles: {
        'body': {
          'font-size': '16px',
        },
        'input': {
          'font-size': '1rem',
          'font-family': 'Roboto,sans-serif',
          'color': 'rgba(0, 0, 0, 0.87)',
        },
        ':disabled': {
          color: 'rgba(0, 0, 0, 0.5)',
        },
        'input:not(:focus)::placeholder': {
          color: 'transparent',
        },
        '.invalid': {
          color: 'red',
        },
      },
      fields: {
        number: {
          container: '#card-number',
        },
        cvv: {
          container: '#cvv',
        },
        expirationDate: {
          container: '#expiration',
          placeholder: 'MM / YY',
        },
      },
    });
    setupHostedFieldsEvents(fieldsInstance);
    set(hostedFields, fieldsInstance);
  }
  catch (error: any) {
    set(generalError, `Failed to initialize payment form: ${error.message}`);
    console.error(error);
  }
  finally {
    set(hostedFieldsInitializing, false);
  }
}

function setupHostedFieldsEvents(fieldsInstance: HostedFields): void {
  fieldsInstance.on('focus', (event) => {
    const field = event.emittedBy;
    set(focusedField, field);
    updateFieldState(field, { touched: true });
  });

  fieldsInstance.on('blur', (event) => {
    if (get(focusedField) === event.emittedBy) {
      set(focusedField, '');
    }
  });

  fieldsInstance.on('validityChange', (event) => {
    const field = event.emittedBy;
    const isValid = event.fields[field].isValid;
    updateFieldState(field, { valid: isValid });
  });

  fieldsInstance.on('empty', (event) => {
    updateFieldState(event.emittedBy, { hasContent: false });
  });

  fieldsInstance.on('notEmpty', (event) => {
    updateFieldState(event.emittedBy, { hasContent: true });
  });

  watch(isProcessing, (processing) => {
    const fields = ['number', 'expirationDate', 'cvv'] as const;

    fields.forEach((field) => {
      if (processing) {
        fieldsInstance.setAttribute({
          field,
          attribute: 'disabled',
          value: true,
        });
      }
      else {
        fieldsInstance.removeAttribute({
          field,
          attribute: 'disabled',
        });
      }
    });
  });
}

async function tokenizeHostedFields(): Promise<{ nonce: string; bin: string }> {
  const fieldsInstance = get(hostedFields);
  if (!fieldsInstance) {
    throw new Error('Hosted fields not initialized');
  }

  const { nonce, details } = await fieldsInstance.tokenize();
  return { nonce, bin: details.bin };
}

async function getSavedCardBin(card: SavedCard): Promise<string> {
  let vaultManager: VaultManager | null = null;

  try {
    vaultManager = await createVaultManager({
      client: newClient,
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
  set(generalError, '');

  try {
    const card = get(savedCard);

    let paymentToken: string;
    let paymentBin: string;

    if (card) {
      paymentBin = await getSavedCardBin(card);
      paymentToken = card.token;
    }
    else {
      const { nonce, bin } = await tokenizeHostedFields();
      paymentBin = bin;
      paymentToken = await addCard({
        paymentMethodNonce: nonce,
      });

      await refreshSavedCard();
    }

    const paymentNonce = await createCardNonce({
      paymentToken,
    });

    const threeDSecureParams = {
      token: clientToken,
      planMonths: planData.months,
      amount: planData.finalPriceInEur,
      nonce: paymentNonce,
      bin: paymentBin,
    };

    sessionStorage.setItem('threeDSecureData', JSON.stringify(threeDSecureParams));
    window.location.href = '/checkout/pay/3d-secure';
  }
  catch (error: any) {
    set(generalError, error.message || 'Payment failed. Please try again.');
    set(isProcessing, false);
  }
}

function goBack(): void {
  navigateTo({
    name: 'checkout-pay-method',
    query: {
      plan: get(planMonths),
    },
  });
}

const last4Digits = computed<string>(() => {
  const card = get(savedCard);
  return card ? `**** **** **** ${card.last4}` : '';
});

function deleteCardClick(): void {
  set(showDeleteConfirmation, true);
}

async function handleDeleteCard(): Promise<void> {
  const card = get(savedCard);
  if (!card)
    return;

  set(showDeleteConfirmation, false);
  set(deletingCard, true);

  try {
    await deleteCard(card.token);
    await refreshSavedCard();
  }
  catch (error: any) {
    set(generalError, error.message || 'Failed to delete card');
  }
  finally {
    set(deletingCard, false);
  }
}

onMounted(async () => {
  if (!get(savedCard)) {
    await initializeHostedFields();
  }
});

watch(savedCard, async (newCard, oldCard) => {
  if (oldCard && !newCard && !get(hostedFields)) {
    await nextTick();
    await initializeHostedFields();
  }
});

onUnmounted(async () => {
  try {
    const fieldsInstance = get(hostedFields);
    await fieldsInstance?.teardown();
    set(hostedFields, undefined);
    await newClient?.teardown(() => {});
  }
  catch (error) {
    console.error('Error during cleanup:', error);
  }
});
</script>

<template>
  <div class="flex flex-col w-full max-w-[29rem] mx-auto mt-8 lg:mt-0 grow">
    <!-- Title -->
    <h2 class="text-h5 text-rui-text font-bold mb-2">
      {{ t('home.plans.tiers.step_3.title') }}
    </h2>
    <p class="text-body-1 text-rui-text-secondary mb-6">
      {{ t('home.plans.tiers.step_3.payment_description') }}
    </p>

    <!-- Payment Form -->
    <div class="my-6 grow flex flex-col">
      <!-- Error Message -->
      <div
        v-if="generalError"
        class="p-4 bg-red-50 border border-red-200 rounded mb-4"
      >
        <p class="text-red-800">
          {{ generalError }}
        </p>
      </div>

      <!-- Saved Card Display -->
      <div v-if="savedCard">
        <div class="p-4 flex items-center gap-4 border rounded-md mb-4">
          <div class="rounded-md bg-rui-grey-50 h-10 w-14 flex items-center justify-center">
            <img
              :src="savedCard.imageUrl"
              :alt="t('payment.card.card_image_alt')"
              class="w-full h-full object-contain object-center"
            />
          </div>
          <div class="grow">
            <div class="text-rui-text">
              {{ last4Digits }}
            </div>
            <div class="text-sm text-rui-text-secondary">
              {{ t('home.plans.tiers.step_3.saved_card.expiry', { expiresAt: savedCard.expiresAt }) }}
            </div>
          </div>
          <button
            type="button"
            class="w-10 h-10 relative flex items-center justify-center gap-2 text-base font-medium leading-[1.625rem] outline-1 outline-offset-[-1px] outline-transparent rounded border-0 p-0 transition-all duration-150 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isProcessing || deletingCard"
            @click="deleteCardClick()"
          >
            <svg
              v-if="!deletingCard"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <svg
              v-else
              class="animate-spin w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 814 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </button>
        </div>

        <!-- Expired Card Error -->
        <div
          v-if="isCardExpired"
          class="p-4 bg-red-50 border border-red-200 rounded mb-4"
        >
          <p class="text-red-800 mb-2">
            {{ t('home.plans.tiers.step_3.saved_card.card_expired') }}
          </p>
          <p class="text-red-700 text-sm">
            {{ t('home.plans.tiers.step_3.saved_card.delete_expired_card') }}
          </p>
        </div>
      </div>

      <!-- Card Form Fields (only show if no saved card) -->
      <div
        v-show="!savedCard"
        class="grid grid-rows-2 grid-cols-2 gap-x-4 gap-y-8"
      >
        <!-- Card Number Field (spans 2 columns) -->
        <div class="col-span-2 relative w-full flex items-center">
          <div class="flex items-center shrink-0">
            <div class="ml-3 mr-2">
              <svg
                class="w-6 h-6 text-black/[0.54]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
          </div>
          <div class="flex flex-1 overflow-hidden">
            <!-- Hosted field container for card number -->
            <div
              id="card-number"
              class="leading-6 text-rui-text w-full bg-transparent outline-0 outline-none transition-all h-14 border-b-0 px-3"
            />
            <label
              class="left-0 text-base leading-[3.5] text-rui-text-secondary pointer-events-none absolute flex h-full w-full select-none transition-all border-0 border-transparent"
              :class="{
                'leading-tight text-xs -top-2': focusedField === 'number' || fieldContent.number,
                'top-0': focusedField !== 'number' && !fieldContent.number,
                'text-rui-error': fieldErrors.number,
                'text-rui-success': focusedField === 'number' && !fieldErrors.number,
                'pl-3': focusedField !== 'number' && !fieldContent.number,
                'pl-4': focusedField === 'number' || fieldContent.number,
              }"
              :style="{
                paddingLeft: (focusedField === 'number' || fieldContent.number) ? '0.75rem' : 'calc(0.75rem + 2.25rem)',
              }"
            >
              {{ t('payment.card.number') }}
            </label>
            <fieldset
              class="absolute w-full top-0 left-0 pointer-events-none rounded border px-2 transition-all -mt-2 h-[calc(100%+0.5rem)]"
              :class="{
                'border-2 border-rui-error': fieldErrors.number,
                'border-2 border-rui-success': focusedField === 'number' && !fieldErrors.number,
                'border border-black/[0.23]': focusedField !== 'number' && !fieldContent.number && !fieldErrors.number,
              }"
            >
              <legend class="opacity-0 text-xs whitespace-break-spaces">
                <span v-if="focusedField === 'number' || fieldContent.number">  {{ t('payment.card.number') }}  </span>
                <span v-else>&#8203;</span>
              </legend>
            </fieldset>
          </div>
        </div>

        <!-- Expiration Field -->
        <div class="relative w-full flex items-center">
          <div class="flex flex-1 overflow-hidden">
            <!-- Hosted field container for expiration -->
            <div
              id="expiration"
              class="leading-6 text-rui-text w-full bg-transparent outline-0 outline-none transition-all h-14 border-b-0 px-3"
            />
            <label
              class="left-0 text-base leading-[3.5] text-rui-text-secondary pointer-events-none absolute flex h-full w-full select-none transition-all border-0 border-transparent pl-3"
              :class="{
                'leading-tight text-xs -top-2 pl-4': focusedField === 'expirationDate' || fieldContent.expirationDate,
                'top-0': focusedField !== 'expirationDate' && !fieldContent.expirationDate,
                'text-rui-error': fieldErrors.expirationDate,
                'text-rui-success': focusedField === 'expirationDate' && !fieldErrors.expirationDate,
              }"
            >
              {{ t('payment.card.expiration') }}
            </label>
            <fieldset
              class="absolute w-full top-0 left-0 pointer-events-none rounded border px-2 transition-all -mt-2 h-[calc(100%+0.5rem)]"
              :class="{
                'border-2 border-rui-error': fieldErrors.expirationDate,
                'border-2 border-rui-success': focusedField === 'expirationDate' && !fieldErrors.expirationDate,
                'border border-black/[0.23]': focusedField !== 'expirationDate' && !fieldContent.expirationDate && !fieldErrors.expirationDate,
              }"
            >
              <legend class="opacity-0 text-xs whitespace-break-spaces">
                <span v-if="focusedField === 'expirationDate' || fieldContent.expirationDate">  {{ t('payment.card.expiration') }}  </span>
                <span v-else>&#8203;</span>
              </legend>
            </fieldset>
          </div>
        </div>

        <!-- CVV Field -->
        <div class="relative w-full flex items-center">
          <div class="flex flex-1 overflow-hidden">
            <!-- Hosted field container for CVV -->
            <div
              id="cvv"
              class="leading-6 text-rui-text w-full bg-transparent outline-0 outline-none transition-all h-14 border-b-0 px-3"
            />
            <label
              class="left-0 text-base leading-[3.5] text-rui-text-secondary pointer-events-none absolute flex h-full w-full select-none transition-all border-0 border-transparent pl-3"
              :class="{
                'leading-tight text-xs -top-2 pl-4': focusedField === 'cvv' || fieldContent.cvv,
                'top-0': focusedField !== 'cvv' && !fieldContent.cvv,
                'text-rui-error': fieldErrors.cvv,
                'text-rui-success': focusedField === 'cvv' && !fieldErrors.cvv,
              }"
            >
              {{ t('payment.card.cvv') }}
            </label>
            <fieldset
              class="absolute w-full top-0 left-0 pointer-events-none rounded border px-2 transition-all -mt-2 h-[calc(100%+0.5rem)]"
              :class="{
                'border-2 border-rui-error': fieldErrors.cvv,
                'border-2 border-rui-success': focusedField === 'cvv' && !fieldErrors.cvv,
                'border border-black/[0.23]': focusedField !== 'cvv' && !fieldErrors.cvv,
              }"
            >
              <legend class="opacity-0 text-xs whitespace-break-spaces">
                <span v-if="focusedField === 'cvv' || fieldContent.cvv">  {{ t('payment.card.cvv') }}  </span>
                <span v-else>&#8203;</span>
              </legend>
            </fieldset>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <hr class="my-8 border-rui-grey-300" />

      <!-- Plan Summary -->
      <div
        class="mb-6"
      >
        <h3 class="text-body-1 font-medium text-rui-text mb-3">
          {{ t('subscription.selected_plan') }}
        </h3>
        <div class="p-4 bg-rui-grey-50 rounded-lg">
          <div class="flex justify-between items-center">
            <div>
              <p class="font-medium text-rui-text">
                {{ planData.months === 12 ? 'Premium Plan (Annual)' : `Premium Plan (${planData.months} months)` }}
              </p>
              <p class="text-sm text-rui-text-secondary">
                {{ planData.months }} months subscription
              </p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-rui-text">
                €{{ planData.finalPriceInEur }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Accept Refund Policy -->
      <div class="my-8">
        <label class="flex items-center cursor-pointer">
          <input
            v-model="acceptedTerms"
            type="checkbox"
            class="h-5 w-5 accent-rui-primary border-2 border-rui-grey-300 rounded focus:ring-rui-primary"
            :disabled="isProcessing"
          />
          <span class="ml-3 text-body-2 text-rui-text-secondary">
            <i18n-t
              keypath="policies.refund.accept_policy.text"
              tag="span"
            >
              <template #action>
                <NuxtLink
                  to="/refund-policy"
                  external
                  target="_blank"
                  class="text-rui-primary hover:text-rui-primary-darker underline"
                >
                  {{ t('policies.refund.accept_policy.action') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </span>
        </label>
      </div>

      <!-- Pending Payment Message -->
      <div
        v-if="isProcessing"
        class="my-8"
      >
        <div class="p-4 bg-blue-50 border border-blue-200 rounded">
          <p class="text-blue-800">
            {{ t('subscription.progress.payment_progress_wait') }}
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-4 justify-center mt-9 w-full max-w-[27.5rem] mx-auto">
        <button
          type="button"
          class="w-full relative flex items-center justify-center gap-2 text-base font-medium leading-[1.625rem] outline-1 outline-offset-[-1px] outline-transparent rounded border-0 px-6 py-2 transition-all duration-150 bg-rui-grey-200 text-rui-text hover:bg-rui-grey-100 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isProcessing"
          @click="goBack()"
        >
          {{ t('actions.back') }}
        </button>
        <button
          type="button"
          class="w-full relative flex items-center justify-center gap-2 text-base font-medium leading-[1.625rem] outline-1 outline-offset-[-1px] outline-transparent rounded border-0 px-6 py-2 transition-all duration-150 bg-rui-primary text-white hover:bg-rui-primary-darker disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!isFormValid || isProcessing"
          @click="processPayment()"
        >
          <span v-if="!isProcessing">{{ t('actions.continue') }}</span>
          <span
            v-else
            class="flex items-center"
          >
            <svg
              class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 814 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{ t('subscription.progress.processing') }}
          </span>
        </button>
      </div>
    </div>
  </div>

  <!-- Delete Card Confirmation Dialog -->
  <div
    v-if="showDeleteConfirmation"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="showDeleteConfirmation = false"
  >
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-medium text-rui-text mb-4">
        {{ t('home.plans.tiers.step_3.saved_card.delete.title') }}
      </h3>
      <p class="text-rui-text-secondary mb-6">
        {{ t('home.plans.tiers.step_3.saved_card.delete.description') }}
      </p>
      <div class="flex justify-end gap-4">
        <button
          type="button"
          class="relative flex items-center justify-center gap-2 text-base font-medium leading-[1.625rem] outline-1 outline-offset-[-1px] outline-transparent rounded border-0 px-6 py-2 transition-all duration-150 bg-white text-rui-primary hover:bg-rui-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="showDeleteConfirmation = false"
        >
          {{ t('actions.cancel') }}
        </button>
        <button
          type="button"
          class="relative flex items-center justify-center gap-2 text-base font-medium leading-[1.625rem] outline-1 outline-offset-[-1px] outline-transparent rounded border-0 px-6 py-2 transition-all duration-150 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleDeleteCard()"
        >
          {{ t('actions.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

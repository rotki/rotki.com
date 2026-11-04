<script setup lang="ts">
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { PaymentBreakdownDiscount, PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { VatIdStatus } from '@rotki/card-payment-common/schemas/account';
import { AUTO_DISCOUNT_DISMISSED_KEY, getValidDiscountCode } from '@rotki/card-payment-common/utils/checkout';
import DiscountCodeField from '@rotki/checkout-ui/components/DiscountCodeField.vue';
import PriceRows from '@rotki/checkout-ui/components/PriceRows.vue';
import { get, set, useSessionStorage, watchImmediate } from '@vueuse/core';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useBraintreeClient } from '@/composables/braintree-client';
import { useCardCheckout } from '@/composables/card-checkout';
import { useSavedCardSelection } from '@/composables/saved-card-selection';
import { paths } from '@/config/paths';
import { reportCardFailure } from '@/utils/card-api';
import AddCardDialog from './AddCardDialog.vue';
import CardSelectionDialog from './CardSelectionDialog.vue';
import NewCardForm from './NewCardForm.vue';
import PaymentButtons from './PaymentButtons.vue';
import PlanSummary from './PlanSummary.vue';
import SavedCardDisplay from './SavedCardDisplay.vue';
import TermsAcceptance from './TermsAcceptance.vue';

const selectedCard = defineModel<SavedCard | undefined>('selectedCard', { required: true });
/** Whether the running campaign's code is the discount the breakdown confirmed. */
const campaignApplied = defineModel<boolean>('campaignApplied', { default: false });

const { planData, selectedPlan, upgradeSubId, cards, vatIdStatus, country, discount = {} } = defineProps<{
  planData: PaymentBreakdownResponse;
  selectedPlan: SelectedPlan;
  upgradeSubId: string | null;
  cards: SavedCard[];
  vatIdStatus?: string;
  country?: string;
  discount?: {
    /** Code to start with, already resolved from the URL, referral, campaign and dismissal. */
    initialCode?: string;
    /** Running campaign; its code counts as the campaign discount and is offered in the field's hint. */
    campaign?: { code: string; percent: number };
  };
}>();

const emit = defineEmits<{
  'go-back': [];
  'payment-success': [];
  'refresh-card': [];
  /**
   * Fatal errors that make the whole payment view unusable (e.g. Braintree client
   * failed to initialize). The parent should show a full-screen ErrorState.
   * Per-transaction errors (card decline, payment failure) stay inline.
   */
  'fatal-error': [message: string];
}>();

defineSlots<{
  /** Switching to another payment method, shown under the title. */
  methods?: () => any;
}>();

const acceptedTerms = ref<boolean>(false);
const newCardFormValid = ref<boolean>(false);
const showCardSelectionDialog = ref<boolean>(false);
const showAddCardDialog = ref<boolean>(false);
// Shared with the website checkout: set once the buyer removes an auto-applied code.
const autoDiscountDismissed = useSessionStorage<boolean>(AUTO_DISCOUNT_DISMISSED_KEY, false);
// Seeded before PlanSummary's first fetch, so the initial breakdown already carries the code.
const discountCode = ref<string>(discount.initialCode ?? '');
// Breakdown from PlanSummary via v-model
const breakdown = ref<PaymentBreakdownResponse>();
const newCardForm = useTemplateRef<InstanceType<typeof NewCardForm>>('newCardForm');

const { client } = useBraintreeClient(planData.braintreeClientToken, (error) => {
  emit('fatal-error', reportCardFailure(error, {
    failure: 'BRAINTREE_INIT_FAILED',
    planId: selectedPlan.planId,
    isUpgrade: !!upgradeSubId,
    step: 'init',
  }));
});

const { processing, transactionError, setTransactionError, submit } = useCardCheckout({
  plan: () => selectedPlan,
  upgradeSubId: () => upgradeSubId ?? undefined,
  clientToken: () => planData.braintreeClientToken,
  breakdown,
  discountCode,
  client,
  tokenizeNewCard: async () => get(newCardForm)?.tokenize(),
  onCardSaved: () => emit('refresh-card'),
  onHandoff: () => emit('payment-success'),
});

const { selectWhenAdded } = useSavedCardSelection(selectedCard, () => cards);

const discountInfo = computed<PaymentBreakdownDiscount | undefined>(() => get(breakdown)?.discount ?? undefined);

const showVatWarning = computed<boolean>(() => vatIdStatus === VatIdStatus.NOT_VALID && country !== 'DE');

// The API sends the next payment as a unix timestamp in seconds; 0 means it has none.
const renewsAt = computed<Date | undefined>(() => (planData.nextPayment ? new Date(planData.nextPayment * 1000) : undefined));

const isFormValid = computed<boolean>(() => {
  if (!get(acceptedTerms) || get(processing))
    return false;

  return !!get(selectedCard) || get(newCardFormValid);
});

/** Remembers a removed code across payment pages; entering a code lifts the dismissal again. */
function handleDiscountEdit(code: string): void {
  set(autoDiscountDismissed, !code);
}

function handleCardAdded(token: string): void {
  selectWhenAdded(token);
  emit('refresh-card');
}

watchImmediate(() => getValidDiscountCode(get(discountInfo), get(discountCode) || undefined), (validCode) => {
  set(campaignApplied, !!discount.campaign && validCode === discount.campaign.code);
});

// Clear discount code only when a previously valid discount becomes invalid (e.g., plan switch)
watch(breakdown, (newBreakdown, oldBreakdown) => {
  if (get(discountCode) && oldBreakdown?.discount?.isValid && !getValidDiscountCode(newBreakdown?.discount, get(discountCode))) {
    set(discountCode, '');
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

    <div
      v-if="$slots.methods"
      class="mb-6"
    >
      <slot name="methods" />
    </div>

    <!-- Two Column Layout -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr] xl:gap-8 xl:items-start">
      <!-- Left Column: Payment Form -->
      <div class="flex flex-col gap-6 min-w-0">
        <!-- Inline transaction error (card decline, payment failure, etc.) -->
        <div
          v-if="transactionError"
          class="flex items-start gap-3 rounded-md border border-rui-error/30 bg-rui-error/10 p-4 text-sm text-rui-error"
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
          <span class="flex-1">{{ transactionError }}</span>
          <button
            type="button"
            class="shrink-0 text-rui-error hover:opacity-70"
            aria-label="Dismiss"
            @click="setTransactionError(undefined)"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Card Input Section -->
        <div class="bg-white rounded-lg border border-rui-grey-300 p-6">
          <!-- Saved Card Display -->
          <div v-if="selectedCard">
            <SavedCardDisplay
              :card="selectedCard"
              :disabled="processing"
              @card-deleted="emit('refresh-card')"
              @error="setTransactionError($event)"
            />

            <!-- Button to change card -->
            <div class="flex justify-end mt-4">
              <button
                type="button"
                :disabled="processing"
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
            :disabled="processing"
            @validation-change="newCardFormValid = $event"
            @error="setTransactionError($event)"
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
            v-model:breakdown="breakdown"
            :upgrade="!!upgradeSubId"
            :selected-plan="selectedPlan"
            :discount-code="discountCode || undefined"
          />

          <hr class="my-4 border-rui-grey-300" />

          <!-- Discount Code Input -->
          <DiscountCodeField
            v-model="discountCode"
            :discount="discountInfo"
            :campaign="discount.campaign"
            class="mb-4"
            @apply="handleDiscountEdit($event)"
          />

          <!-- VAT Warning -->
          <div
            v-if="showVatWarning"
            class="mb-4 rounded-sm border border-rui-warning p-3 text-sm text-rui-warning-darker"
          >
            No VAT Reverse charge applied. Your VAT ID could not be verified. Update it in
            <a
              :href="`${paths.hostUrlBase}/home/billing`"
              class="font-medium underline"
            >
              Billing
            </a>.
          </div>

          <!-- Payment Grand Total -->
          <PriceRows
            :plan="selectedPlan"
            :breakdown="breakdown"
            :upgrade="!!upgradeSubId"
            :duration-in-months="selectedPlan.durationInMonths"
            :renews-at="renewsAt"
          />
        </div>
      </aside>
    </div>

    <!-- Accept Refund Policy (Outside Grid) -->
    <TermsAcceptance
      v-model:accepted-terms="acceptedTerms"
      :disabled="processing"
      class="max-w-110 mx-auto w-full"
    />

    <!-- Full Screen Processing Overlay -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300 ease-in-out"
        leave-active-class="transition-opacity duration-300 ease-in-out"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
        appear
      >
        <div
          v-if="processing"
          class="fixed inset-0 z-rui-blocking flex items-center justify-center bg-black/80 backdrop-blur-xs"
        >
          <div class="flex flex-col items-center justify-center text-center px-4">
            <div class="mb-4">
              <div class="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
            <h3 class="text-lg font-medium text-white mb-1">
              Processing payment
            </h3>
            <p class="text-white/80">
              Please wait and do not close this window...
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Action Buttons (Outside Grid) -->
    <div class="max-w-110 mx-auto w-full">
      <PaymentButtons
        :disabled="!isFormValid"
        :processing="processing"
        @go-back="emit('go-back')"
        @continue="submit(selectedCard)"
      />
    </div>

    <!-- Card Selection Dialog -->
    <CardSelectionDialog
      v-model:open="showCardSelectionDialog"
      :cards="cards"
      :selected-card="selectedCard"
      :disabled="processing"
      @select-card="selectedCard = $event"
      @add-new-card="showAddCardDialog = true"
    />

    <!-- Add Card Dialog -->
    <AddCardDialog
      v-model:open="showAddCardDialog"
      :client="client"
      @card-added="handleCardAdded($event)"
      @refresh-card="emit('refresh-card')"
    />
  </div>
</template>

<script setup lang="ts">
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { AUTO_DISCOUNT_DISMISSED_KEY, getValidDiscountCode, needsVatWarning } from '@rotki/card-payment-common/utils/checkout';
import CheckoutAlert from '@rotki/checkout-ui/components/CheckoutAlert.vue';
import OrderSummary from '@rotki/checkout-ui/components/OrderSummary.vue';
import PaymentPage from '@rotki/checkout-ui/components/PaymentPage.vue';
import PolicyConsent from '@rotki/checkout-ui/components/PolicyConsent.vue';
import ProcessingOverlay from '@rotki/checkout-ui/components/ProcessingOverlay.vue';
import VatNotice from '@rotki/checkout-ui/components/VatNotice.vue';
import { useCheckoutMessages } from '@rotki/checkout-ui/composables/checkout-messages';
import { useOrderTotals } from '@rotki/checkout-ui/composables/order-totals';
import { RuiButton } from '@rotki/ui-library';
import { get, set, useSessionStorage, watchImmediate } from '@vueuse/core';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useBraintreeClient } from '@/composables/braintree-client';
import { useCardCheckout } from '@/composables/card-checkout';
import { usePaymentBreakdown } from '@/composables/payment-breakdown';
import { reportCardFailure } from '@/utils/card-api';
import { routes } from '@/utils/navigation';
import CardDetails from './CardDetails.vue';

const selectedCard = defineModel<SavedCard | undefined>('selectedCard', { required: true });
/** Whether the running campaign's code is the discount the breakdown confirmed. */
const campaignApplied = defineModel<boolean>('campaignApplied', { default: false });

const { planData, selectedPlan, upgradeSubId, cards, cardsFailed = false, vatIdStatus, country, discount = {} } = defineProps<{
  planData: PaymentBreakdownResponse;
  selectedPlan: SelectedPlan;
  upgradeSubId: string | null;
  /** `undefined` while the saved cards load. */
  cards?: SavedCard[];
  /** The saved cards could not be loaded, so an empty list does not mean the buyer has none. */
  cardsFailed?: boolean;
  vatIdStatus?: string;
  country?: string;
  discount?: {
    /** Code to start with, already resolved from the URL, referral, campaign and dismissal. */
    initialCode?: string;
    /** Running campaign; its code counts as the campaign discount and is offered next to the field. */
    campaign?: { code: string; percent: number };
  };
}>();

const emit = defineEmits<{
  /** The card is verified and handed to the website's 3D Secure page. */
  'handoff': [];
  'refresh-card': [];
  /**
   * Fatal errors that make the whole payment view unusable (e.g. Braintree client
   * failed to initialize). The parent should show a full-screen ErrorState.
   * Per-transaction errors (card decline, payment failure) stay inline.
   */
  'fatal-error': [message: string];
}>();

defineSlots<{
  /** Switching to another payment method, under the heading. */
  'methods'?: () => any;
  /** Next to the plan name, e.g. a button to change the plan. */
  'plan-action'?: (props: { disabled: boolean }) => any;
}>();

const t = useCheckoutMessages();

const acceptedTerms = ref<boolean>(false);
const cardsFailedDismissed = ref<boolean>(false);
const newCardFormValid = ref<boolean>(false);
// Shared with the website checkout: set once the buyer removes an auto-applied code.
const autoDiscountDismissed = useSessionStorage<boolean>(AUTO_DISCOUNT_DISMISSED_KEY, false);
// Seeded before the first breakdown request, so it already carries the code.
const discountCode = ref<string>(discount.initialCode ?? '');
const cardDetails = useTemplateRef<InstanceType<typeof CardDetails>>('cardDetails');

const { breakdown, loading: breakdownLoading } = usePaymentBreakdown(() => selectedPlan, () => get(discountCode) || undefined, planData);

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
  tokenizeNewCard: async () => get(cardDetails)?.tokenize(),
  onCardSaved: () => emit('refresh-card'),
  onHandoff: () => emit('handoff'),
});

const showVatWarning = computed<boolean>(() => needsVatWarning(vatIdStatus, country));

// The API sends the next payment as a unix timestamp in seconds; 0 means it has none.
const renewsAt = computed<Date | undefined>(() => {
  const next = get(breakdown)?.nextPayment ?? planData.nextPayment;
  return next ? new Date(next * 1000) : undefined;
});

const { total, totalNote } = useOrderTotals({ plan: () => selectedPlan, breakdown, upgrade: () => !!upgradeSubId });

const payLabel = computed<string>(() => {
  const amount = get(total) ?? '';
  return upgradeSubId ? t('checkout.pay.upgrade', { amount }) : t('checkout.pay.subscribe', { amount });
});

const isFormValid = computed<boolean>(() => {
  if (!get(acceptedTerms) || get(processing) || get(breakdownLoading))
    return false;

  return !!get(selectedCard) || get(newCardFormValid);
});

/** Remembers a removed code across payment pages; entering a code lifts the dismissal again. */
function handleDiscountEdit(code: string): void {
  set(autoDiscountDismissed, !code);
}

watchImmediate(() => getValidDiscountCode(get(breakdown)?.discount, get(discountCode) || undefined), (validCode) => {
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
  <PaymentPage
    :total="total"
    :total-note="totalNote"
  >
    <template
      v-if="$slots.methods"
      #methods
    >
      <slot name="methods" />
    </template>

    <CheckoutAlert
      v-if="transactionError"
      :message="transactionError"
      data-cy="transaction-error"
      @dismiss="setTransactionError(undefined)"
    />

    <CheckoutAlert
      v-if="cardsFailed && !cardsFailedDismissed"
      :message="t('checkout.card_page.cards_load_failed')"
      data-cy="cards-load-failed"
      @dismiss="cardsFailedDismissed = true"
    />

    <CardDetails
      ref="cardDetails"
      v-model:selected-card="selectedCard"
      :client="client"
      :cards="cards"
      :disabled="processing"
      @validation-change="newCardFormValid = $event"
      @error="setTransactionError($event)"
      @refresh-card="emit('refresh-card')"
    />

    <template #summary>
      <OrderSummary
        v-model:code="discountCode"
        :plan="selectedPlan"
        :breakdown="breakdown"
        :upgrade="!!upgradeSubId"
        :loading="breakdownLoading"
        :disabled="processing"
        :campaign="discount.campaign"
        :renews-at="renewsAt"
        @apply="handleDiscountEdit($event)"
      >
        <template
          v-if="$slots['plan-action']"
          #plan-action
        >
          <slot
            name="plan-action"
            :disabled="processing || breakdownLoading"
          />
        </template>
        <template
          v-if="showVatWarning"
          #notice
        >
          <VatNotice :billing-href="routes.billing" />
        </template>
      </OrderSummary>
    </template>

    <template #pay>
      <div class="flex flex-col gap-2">
        <PolicyConsent
          v-model="acceptedTerms"
          :policy-href="routes.refundPolicy"
          :disabled="processing"
        />
        <RuiButton
          color="primary"
          size="lg"
          class="w-full"
          :disabled="!isFormValid"
          :loading="processing"
          data-cy="pay"
          @click="submit(selectedCard)"
        >
          {{ payLabel }}
        </RuiButton>
      </div>
    </template>
  </PaymentPage>

  <ProcessingOverlay :visible="processing" />
</template>

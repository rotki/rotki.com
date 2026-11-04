<script setup lang="ts">
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { VatIdStatus } from '@rotki/card-payment-common/schemas/account';
import { AUTO_DISCOUNT_DISMISSED_KEY, getValidDiscountCode } from '@rotki/card-payment-common/utils/checkout';
import { buildOrderSummary, type OrderSummary as OrderSummaryData } from '@rotki/card-payment-common/utils/order-summary';
import OrderSummary from '@rotki/checkout-ui/components/OrderSummary.vue';
import PaymentPage from '@rotki/checkout-ui/components/PaymentPage.vue';
import PolicyConsent from '@rotki/checkout-ui/components/PolicyConsent.vue';
import { useCheckoutMessages } from '@rotki/checkout-ui/composables/checkout-messages';
import { RuiButton } from '@rotki/ui-library';
import { get, set, useSessionStorage, watchImmediate } from '@vueuse/core';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useBraintreeClient } from '@/composables/braintree-client';
import { useCardCheckout } from '@/composables/card-checkout';
import { usePaymentBreakdown } from '@/composables/payment-breakdown';
import { paths } from '@/config/paths';
import { reportCardFailure } from '@/utils/card-api';
import { routes } from '@/utils/navigation';
import CardDetails from './CardDetails.vue';

const selectedCard = defineModel<SavedCard | undefined>('selectedCard', { required: true });
/** Whether the running campaign's code is the discount the breakdown confirmed. */
const campaignApplied = defineModel<boolean>('campaignApplied', { default: false });

const { planData, selectedPlan, upgradeSubId, cards, vatIdStatus, country, discount = {} } = defineProps<{
  planData: PaymentBreakdownResponse;
  selectedPlan: SelectedPlan;
  upgradeSubId: string | null;
  /** `undefined` while the saved cards load. */
  cards?: SavedCard[];
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
  /** Switching to another payment method, under the heading. */
  methods?: () => any;
}>();

const t = useCheckoutMessages();

const acceptedTerms = ref<boolean>(false);
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
  onHandoff: () => emit('payment-success'),
});

const showVatWarning = computed<boolean>(() => vatIdStatus === VatIdStatus.NOT_VALID && country !== 'DE');

// The API sends the next payment as a unix timestamp in seconds; 0 means it has none.
const renewsAt = computed<Date | undefined>(() => (planData.nextPayment ? new Date(planData.nextPayment * 1000) : undefined));

const summary = computed<OrderSummaryData>(() => buildOrderSummary({ plan: selectedPlan, breakdown: get(breakdown), upgrade: !!upgradeSubId }));

const total = computed<string>(() => get(summary).dueToday.formatted);

/** The phone summary bar's line under the total. */
const totalNote = computed<string>(() => {
  const amount = get(summary).renewal.formatted;
  return selectedPlan.durationInMonths === 12 ? t('checkout.page.then_year', { amount }) : t('checkout.page.then_month', { amount });
});

const payLabel = computed<string>(() => (upgradeSubId
  ? t('checkout.pay.upgrade', { amount: get(total) })
  : t('checkout.pay.subscribe', { amount: get(total) })));

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

    <div
      v-if="transactionError"
      class="flex items-start gap-3 rounded-rui-control border border-rui-error-border bg-rui-error-subtle p-4 text-sm text-rui-error-darker"
      role="alert"
      data-cy="transaction-error"
    >
      <svg
        aria-hidden="true"
        class="size-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span class="flex-1">{{ transactionError }}</span>
      <button
        type="button"
        class="shrink-0 hover:opacity-70"
        aria-label="Dismiss"
        @click="setTransactionError(undefined)"
      >
        <svg
          aria-hidden="true"
          class="size-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

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
          v-if="showVatWarning"
          #notice
        >
          <p class="rounded-rui-control border border-rui-warning-border bg-rui-warning-subtle p-3 text-sm text-rui-warning-darker">
            No VAT reverse charge applied: your VAT ID could not be verified. Update it in
            <a
              :href="`${paths.hostUrlBase}/home/billing`"
              class="font-medium underline"
            >
              Billing
            </a>.
          </p>
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
</template>

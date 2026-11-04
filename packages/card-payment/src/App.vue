<script setup lang="ts">
import type { Account } from '@rotki/card-payment-common/schemas/account';
import type { ActiveCampaign } from '@rotki/card-payment-common/schemas/campaign';
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { AUTO_DISCOUNT_DISMISSED_KEY, resolveDiscountCode } from '@rotki/card-payment-common/utils/checkout';
import CheckoutShell from '@rotki/checkout-ui/components/CheckoutShell.vue';
import MethodTiles from '@rotki/checkout-ui/components/MethodTiles.vue';
import { get, set } from '@vueuse/core';
import { computed, onMounted, ref } from 'vue';
import CampaignRibbon from '@/components/CampaignRibbon.vue';
import CardPayment from '@/components/CardPayment.vue';
import ErrorState from '@/components/ErrorState.vue';
import LoadingState from '@/components/LoadingState.vue';
import { useCardPageHead } from '@/composables/page-head';
import { paths } from '@/config/paths';
import {
  checkout,
  findSelectedPlanById,
  getActiveCampaign,
  getAvailablePlans,
} from '@/utils/api';
import { getSavedCard } from '@/utils/card-api';
import { checkoutMethodLinks, getUrlParam, navigation, routes, withCheckoutParams } from '@/utils/navigation';
import { canBuyNewSubscription } from '@/utils/navigation-guard';
import logoSmall from '/img/logo-small.svg';

useCardPageHead();

const isLoading = ref<boolean>(true);
const loadingMessage = ref<string>('Checking authentication...');
const errorMessage = ref<string>('');

const upgradeSubId = ref<string | null>(null);
const planData = ref<PaymentBreakdownResponse>();
const selectedPlan = ref<SelectedPlan>();
const selectedCard = ref<SavedCard>();

const campaign = ref<ActiveCampaign>();
const campaignApplied = ref<boolean>(false);
const initialDiscountCode = ref<string>('');

const discount = computed<{ initialCode: string; campaign?: { code: string; percent: number } }>(() => {
  const active = get(campaign);
  return {
    initialCode: get(initialDiscountCode),
    // The field only shows while no code is applied, so a running campaign is offered, not claimed.
    campaign: active ? { code: active.code, percent: active.percent } : undefined,
  };
});

/** Explicit code, then referral, then campaign, unless the buyer removed an auto-applied code. */
function resolveInitialDiscountCode(activeCampaign: ActiveCampaign | undefined): string {
  return resolveDiscountCode({
    explicit: getUrlParam('discountCode') ?? undefined,
    dismissed: sessionStorage.getItem(AUTO_DISCOUNT_DISMISSED_KEY) === 'true',
    referral: getUrlParam('ref') ?? undefined,
    campaign: activeCampaign?.code,
  }) ?? '';
}

/** `undefined` until the saved cards arrive; the page renders without waiting for them. */
const cards = ref<SavedCard[]>();
const accountData = ref<Account>();

/*
 * An upgrade keeps the subscription's payment method and starts from the subscription page,
 * so its way back leads there and it gets no switch to another method. The link waits for
 * the load: the prerendered page has no query params, and hydration keeps the prerendered href.
 */
const backHref = computed<string | undefined>(() => {
  if (get(isLoading))
    return undefined;
  return get(upgradeSubId) ? routes.subscription : withCheckoutParams(routes.plans);
});

const methodLinks = checkoutMethodLinks();

/**
 * Load checkout data and available plans in parallel and store them.
 * Returns the error to show when a required piece is missing, `undefined` on success.
 */
async function loadPaymentData(planId: number): Promise<string | undefined> {
  const [checkoutData, availablePlansData, activeCampaign] = await Promise.all([
    checkout(planId),
    getAvailablePlans(),
    getActiveCampaign(),
  ]);
  set(campaign, activeCampaign);
  set(initialDiscountCode, resolveInitialDiscountCode(activeCampaign));

  if (!checkoutData)
    return 'Failed to initialize payment. Please try again.';

  if (!availablePlansData)
    return 'Failed to load plan information. Please try again.';

  const foundPlan = findSelectedPlanById(availablePlansData, planId);
  if (!foundPlan)
    return 'Invalid plan selected. Please try again.';

  set(planData, checkoutData);
  set(selectedPlan, foundPlan);
  return undefined;
}

/** Stores the saved cards and picks the linked one, or the first. */
function applyCards(savedCardData: SavedCard[]): void {
  set(cards, savedCardData);
  const linkedCard = savedCardData.find(card => card.linked);
  set(selectedCard, linkedCard || savedCardData[0]);
}

/** Saved cards come from Braintree through the backend and are the slowest call, so they load on their own. */
function loadCards(): void {
  getSavedCard()
    .then(applyCards)
    .catch((error: unknown) => {
      console.error('Error loading saved cards:', error);
      set(cards, []);
    });
}

async function load(): Promise<void> {
  try {
    // Validate plan ID parameter
    set(loadingMessage, 'Validating plan...');

    const planIdParam = getUrlParam('planId');
    if (!planIdParam) {
      set(errorMessage, 'No plan selected. Please select a plan first.');
      set(isLoading, false);
      return;
    }

    const planId = parseInt(planIdParam);
    if (isNaN(planId) || planId <= 0) {
      set(errorMessage, 'Invalid plan ID. Please select a valid plan.');
      set(isLoading, false);
      return;
    }

    // The payment data loads while the account is checked; a visitor who cannot buy is sent away and it is dropped.
    const paymentData = loadPaymentData(planId).catch((error: unknown) => {
      console.error('Failed to load payment data:', error);
      return 'An error occurred. Please try again.';
    });
    // Rendering does not wait for the cards; the card section shows a placeholder until they arrive.
    loadCards();

    set(loadingMessage, 'Checking authentication...');

    const { canBuy, account } = await canBuyNewSubscription();
    const upgradeId = getUrlParam('upgradeSubId');
    set(upgradeSubId, upgradeId);
    set(accountData, account);

    if (!canBuy && !upgradeId) {
      navigation.goToSubscription();
      return;
    }

    set(loadingMessage, 'Initializing payment...');

    const loadError = await paymentData;
    if (loadError) {
      set(errorMessage, loadError);
      set(isLoading, false);
    }
  }
  catch (error) {
    console.error('Initialization error:', error);
    set(errorMessage, 'An error occurred. Please try again.');
  }
  finally {
    set(isLoading, false);
  }
}

async function refreshCard(): Promise<void> {
  try {
    applyCards(await getSavedCard());
  }
  catch (error: any) {
    console.error('Error refreshing card:', error);
  }
}

onMounted(async () => {
  await load();
});
</script>

<template>
  <CheckoutShell
    step="payment"
    :logo-src="logoSmall"
    :home-href="routes.home"
    :back-href="backHref"
    :back-to="upgradeSubId ? 'subscription' : 'plans'"
    :site-url="paths.hostUrlBase"
  >
    <LoadingState
      v-if="isLoading"
      :message="loadingMessage"
    />

    <ErrorState
      v-else-if="errorMessage"
      :message="errorMessage"
      button-text="Go back"
      @button-click="navigation.goToPlans()"
    />

    <template v-else-if="planData && selectedPlan">
      <CampaignRibbon
        v-if="campaign"
        :campaign="campaign"
        :applied="campaignApplied"
      />

      <CardPayment
        v-model:selected-card="selectedCard"
        v-model:campaign-applied="campaignApplied"
        :discount="discount"
        :cards="cards"
        :plan-data="planData"
        :selected-plan="selectedPlan"
        :upgrade-sub-id="upgradeSubId"
        :vat-id-status="accountData?.vatIdStatus"
        :country="accountData?.address.country"
        @payment-success="navigation.goTo3DSecure(upgradeSubId)"
        @refresh-card="refreshCard()"
        @fatal-error="errorMessage = $event"
      >
        <template
          v-if="!upgradeSubId"
          #methods
        >
          <MethodTiles
            :links="methodLinks"
            current="card"
          />
        </template>
      </CardPayment>
    </template>
  </CheckoutShell>
</template>

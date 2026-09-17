<script setup lang="ts">
import type { Account } from '@rotki/card-payment-common/schemas/account';
import type { ActiveCampaign } from '@rotki/card-payment-common/schemas/campaign';
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { AUTO_DISCOUNT_DISMISSED_KEY, resolveDiscountCode } from '@rotki/card-payment-common/utils/checkout';
import { useHead } from '@unhead/vue';
import { get, set } from '@vueuse/core';
import { computed, onMounted, ref } from 'vue';
import CampaignRibbon from '@/components/CampaignRibbon.vue';
import CardPayment from '@/components/CardPayment.vue';
import CheckoutLayout from '@/components/CheckoutLayout.vue';
import ErrorState from '@/components/ErrorState.vue';
import LoadingState from '@/components/LoadingState.vue';
import { assetPaths, paths } from '@/config/paths';
import { en } from '@/i18n/en';
import DefaultLayout from '@/layouts/default.vue';
import {
  checkout,
  findSelectedPlanById,
  getActiveCampaign,
  getAvailablePlans,
} from '@/utils/api';
import { getSavedCard } from '@/utils/card-api';
import { getUrlParam, navigation } from '@/utils/navigation';
import { canBuyNewSubscription } from '@/utils/navigation-guard';

// Configure head management for SSG
useHead({
  title: 'Pay with Card - rotki',
  meta: [
    // Primary Meta Tags
    { name: 'title', content: 'Pay with Card - rotki' },
    { name: 'description', content: 'Complete your rotki premium subscription payment' },

    // Open Graph / Facebook
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: paths.appUrlBase },
    { property: 'og:title', content: 'Pay with Card - rotki' },
    { property: 'og:description', content: 'Complete your rotki premium subscription payment' },
    { property: 'og:image', content: assetPaths.hostAsset('/img/og/share.png') },

    // Twitter
    { property: 'twitter:card', content: 'summary_large_image' },
    { property: 'twitter:url', content: paths.appUrlBase },
    { property: 'twitter:title', content: 'Pay with Card - rotki' },
    { property: 'twitter:description', content: 'Complete your rotki premium subscription payment' },
    { property: 'twitter:image', content: assetPaths.hostAsset('/img/og/share.png') },

    // Additional SEO Tags
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'author', content: 'Rotki Solutions GmbH' },
    { name: 'keywords', content: 'rotki, premium, subscription, payment, card payment, cryptocurrency accounting' },

    // Theme Color
    { name: 'theme-color', content: '#4ade80' },
  ],
  link: [
    // Favicon - app-specific favicons served from card payment path
    { rel: 'icon', type: 'image/x-icon', href: assetPaths.appAsset('favicon.ico') },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: assetPaths.appAsset('favicon-32x32.png') },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: assetPaths.appAsset('favicon-16x16.png') },
    { rel: 'apple-touch-icon', href: assetPaths.appAsset('apple-touch-icon.png') },
  ],
});

const isLoading = ref<boolean>(true);
const loadingMessage = ref<string>('Checking authentication...');
const errorMessage = ref<string>('');

const plan = ref<string>();
const upgradeSubId = ref<string | null>(null);
const referralCode = ref<string | null>(null);
const planData = ref<PaymentBreakdownResponse>();
const selectedPlan = ref<SelectedPlan>();
const selectedCard = ref<SavedCard>();

const campaign = ref<ActiveCampaign>();
const campaignApplied = ref<boolean>(false);
const initialDiscountCode = ref<string>('');

const discount = computed<{ initialCode: string; campaignCode?: string; hint?: string }>(() => {
  const active = get(campaign);
  return {
    initialCode: get(initialDiscountCode),
    campaignCode: active?.code,
    // The field only shows while no code is applied, so a running campaign is offered, not claimed.
    hint: active ? en.campaign.hint(active.code, active.percent) : undefined,
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

const cards = ref<SavedCard[]>([]);
const accountData = ref<Account>();

const steps = [{
  title: 'Plan Selection',
  description: 'Choose your subscription plan',
  completed: true,
  current: false,
}, {
  title: 'Payment Methods',
  description: 'Select one of the different methods',
  completed: true,
  current: false,
}, {
  title: 'Payment Details',
  description: 'Proceed to the payment',
  completed: false,
  current: true,
}, {
  title: '3D Secure',
  description: 'Secure payment verification',
  completed: false,
  current: false,
}];

/**
 * Load checkout data, available plans and saved cards in parallel and store them.
 * Returns the error to show when a required piece is missing, `undefined` on success.
 */
async function loadPaymentData(planId: number): Promise<string | undefined> {
  const [checkoutData, availablePlansData, savedCardData, activeCampaign] = await Promise.all([
    checkout(planId),
    getAvailablePlans(),
    getSavedCard(),
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
  set(cards, savedCardData);
  const linkedCard = savedCardData?.find(card => card.linked);
  set(selectedCard, linkedCard || savedCardData?.[0]);
  return undefined;
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

    set(plan, planIdParam);

    // Check user authentication
    set(loadingMessage, 'Checking authentication...');

    const { canBuy, account } = await canBuyNewSubscription();
    const upgradeId = getUrlParam('upgradeSubId');
    const refParam = getUrlParam('ref');
    set(upgradeSubId, upgradeId);
    set(referralCode, refParam);
    set(accountData, account);

    if (!canBuy && !upgradeId) {
      navigation.goToSubscription();
      return;
    }

    set(loadingMessage, 'Initializing payment...');

    const loadError = await loadPaymentData(planId);
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
    const savedCardData = await getSavedCard();
    set(cards, savedCardData);
    const linkedCard = savedCardData?.find(c => c.linked);
    set(selectedCard, linkedCard || savedCardData?.[0]);
  }
  catch (error: any) {
    console.error('Error refreshing card:', error);
  }
}

function back(): void {
  if (get(upgradeSubId)) {
    navigation.goToSubscription();
  }
  else {
    navigation.goToPaymentMethod(get(plan), get(referralCode));
  }
}

onMounted(async () => {
  await load();
});
</script>

<template>
  <DefaultLayout>
    <LoadingState
      v-if="isLoading"
      :message="loadingMessage"
    />

    <ErrorState
      v-else-if="errorMessage"
      :message="errorMessage"
      button-text="Go Back"
      @button-click="plan ? navigation.goToPaymentMethod(plan, referralCode) : navigation.goToHome()"
    />

    <template v-else-if="planData && selectedPlan">
      <CampaignRibbon
        v-if="campaign"
        :campaign="campaign"
        :applied="campaignApplied"
      />

      <CheckoutLayout :steps="steps">
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
          @go-back="back()"
          @refresh-card="refreshCard()"
          @fatal-error="errorMessage = $event"
        />
      </CheckoutLayout>
    </template>
  </DefaultLayout>
</template>

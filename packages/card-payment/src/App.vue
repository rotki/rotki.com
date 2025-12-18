<script setup lang="ts">
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { useHead } from '@unhead/vue';
import { get, set } from '@vueuse/core';
import { onMounted, ref } from 'vue';
import CardPayment from '@/components/CardPayment.vue';
import CheckoutLayout from '@/components/CheckoutLayout.vue';
import ErrorState from '@/components/ErrorState.vue';
import LoadingState from '@/components/LoadingState.vue';
import { assetPaths, paths } from '@/config/paths';
import DefaultLayout from '@/layouts/default.vue';
import {
  checkout,
  findSelectedPlanById,
  getAvailablePlans,
  getSavedCard,
} from '@/utils/api';
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

const cards = ref<SavedCard[]>([]);

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

async function load() {
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

    const canBuy = await canBuyNewSubscription();
    const upgradeId = getUrlParam('upgradeSubId');
    const refParam = getUrlParam('ref');
    set(upgradeSubId, upgradeId);
    set(referralCode, refParam);

    if (!canBuy && !upgradeId) {
      navigation.goToSubscription();
      return;
    }

    set(loadingMessage, 'Initializing payment...');

    // Load checkout data, available plans, and saved card in parallel
    const [checkoutData, availablePlansData, savedCardData] = await Promise.all([
      checkout(planId),
      getAvailablePlans(),
      getSavedCard(),
    ]);

    if (!checkoutData) {
      set(errorMessage, 'Failed to initialize payment. Please try again.');
      set(isLoading, false);
      return;
    }

    if (!availablePlansData) {
      set(errorMessage, 'Failed to load plan information. Please try again.');
      set(isLoading, false);
      return;
    }

    // Find the selected plan by planId
    const foundPlan = findSelectedPlanById(availablePlansData, planId);
    if (!foundPlan) {
      set(errorMessage, 'Invalid plan selected. Please try again.');
      set(isLoading, false);
      return;
    }

    set(planData, checkoutData);
    set(selectedPlan, foundPlan);
    set(cards, savedCardData);
    const linkedCard = savedCardData?.find(card => card.linked);
    set(selectedCard, linkedCard || savedCardData?.[0]);
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

    <CheckoutLayout
      v-else-if="planData && selectedPlan"
      :steps="steps"
      :current-step="3"
    >
      <CardPayment
        v-model:error="errorMessage"
        v-model:selected-card="selectedCard"
        :cards="cards"
        :plan-data="planData"
        :selected-plan="selectedPlan"
        :upgrade-sub-id="upgradeSubId"
        @payment-success="navigation.goTo3DSecure(upgradeSubId)"
        @go-back="back()"
        @refresh-card="refreshCard()"
      />
    </CheckoutLayout>
  </DefaultLayout>
</template>

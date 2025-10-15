<script setup lang="ts">
import type { Account, CheckoutData, SavedCardType } from '@/types';
import { useHead } from '@unhead/vue';
import { set } from '@vueuse/core';
import { onMounted, ref } from 'vue';
import CardPayment from '@/components/CardPayment.vue';
import CheckoutLayout from '@/components/CheckoutLayout.vue';
import ErrorState from '@/components/ErrorState.vue';
import LoadingState from '@/components/LoadingState.vue';
import { assetPaths, paths } from '@/config/paths';
import DefaultLayout from '@/layouts/default.vue';
import {
  canBuyNewSubscription,
  checkout,
  getAccount,
  getSavedCard,
} from '@/utils/api';
import { getDurationFromUrlParam, navigation } from '@/utils/navigation';

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

const plan = ref<string>(getDurationFromUrlParam('plan'));
const planData = ref<CheckoutData>();
const savedCard = ref<SavedCardType>();

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
    // Check user authentication
    set(loadingMessage, 'Checking authentication...');
    const account: Account | null = await getAccount();

    if (!account) {
      // User is not logged in
      console.warn('User not authenticated, redirecting to subscription page');
      navigation.goToSubscription();
      return;
    }

    if (!account.emailConfirmed) {
      // User email not verified
      console.warn('User email not confirmed, redirecting to subscription page');
      navigation.goToSubscription();
      return;
    }

    if (!canBuyNewSubscription(account)) {
      // User cannot buy a new subscription
      console.warn('User cannot buy new subscription, redirecting to subscription page');
      navigation.goToSubscription();
      return;
    }

    set(loadingMessage, 'Initializing payment...');
    const planId = parseInt(plan.value);

    // Load checkout data and saved card in parallel
    const [checkoutData, savedCardData] = await Promise.all([
      checkout(planId),
      getSavedCard(),
    ]);

    if (!checkoutData) {
      set(errorMessage, 'Failed to initialize payment. Please try again.');
      set(isLoading, false);
      return;
    }

    set(planData, checkoutData);
    set(savedCard, savedCardData);
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
    const card = await getSavedCard();
    set(savedCard, card);
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
  <DefaultLayout>
    <LoadingState
      v-if="isLoading"
      :message="loadingMessage"
    />

    <ErrorState
      v-else-if="errorMessage"
      :message="errorMessage"
      button-text="Go Back"
      @button-click="navigation.goToPaymentMethod(plan)"
    />

    <CheckoutLayout
      v-else-if="planData"
      :steps="steps"
      :current-step="3"
    >
      <CardPayment
        v-model:error="errorMessage"
        v-model:saved-card="savedCard"
        :plan-data="planData"
        @payment-success="navigation.goTo3DSecure()"
        @go-back="navigation.goToPaymentMethod(plan)"
        @refresh-card="refreshCard()"
      />
    </CheckoutLayout>
  </DefaultLayout>
</template>

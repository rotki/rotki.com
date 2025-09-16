<script setup lang="ts">
import type { ThreeDSecureParams } from '~/types/three-d-secure';
import { get, set } from '@vueuse/core';
import ErrorState from '~/components/checkout/3d-secure/ErrorState.vue';
import InvalidParamsState from '~/components/checkout/3d-secure/InvalidParamsState.vue';
import LoadingState from '~/components/checkout/3d-secure/LoadingState.vue';
import { useAccountRefresh } from '~/composables/use-app-events';
import { usePaymentApi } from '~/composables/use-payment-api';
import { useThreeDSecure } from '~/composables/use-three-d-secure';
import { commonAttrs, noIndex } from '~/utils/metadata';

// Page configuration - same as other payment pages
definePageMeta({
  middleware: [
    'maintenance',
    'authentication',
    'unverified',
    'subscriber',
  ],
});

const { t } = useI18n({ useScope: 'global' });

// SEO - same pattern as other payment pages
useHead({
  title: '3D Secure Verification',
  meta: [
    {
      name: 'description',
      content: '3D Secure verification for secure credit card payment processing',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});

// Use 3D Secure composable
const {
  state,
  error,
  challengeVisible,
  isProcessing,
  canRetry,
  getStoredParams,
  initialize,
  verify,
  navigateToPayment,
  cleanup,
  clearStoredData,
} = useThreeDSecure();

// Use payment API for finalizing payment
const paymentApi = usePaymentApi();
const { requestRefresh } = useAccountRefresh();

// Component state
const params = ref<ThreeDSecureParams>();
const hasValidParams = computed<boolean>(() => !!get(params));

/**
 * Handle retry verification
 */
async function handleRetry(): Promise<void> {
  const storedParams = get(params);
  if (!storedParams)
    return;

  try {
    const payEvent = await verify(storedParams);
    // If verification succeeds, finalize payment with API call
    const result = await paymentApi.pay({
      months: payEvent.months,
      paymentMethodNonce: payEvent.nonce,
    });

    if (result.isError) {
      throw new Error(result.error.message);
    }

    // Request account refresh after successful payment
    requestRefresh();

    // Clear stored data and redirect to success page
    clearStoredData();
    sessionStorage.setItem('payment-completed', 'true');
    await navigateTo('/checkout/success');
  }
  catch {
    // Error handled by the composable state
  }
}

/**
 * Handle navigation back to payment page
 */
function handleBack(): void {
  const storedParams = get(params);
  if (storedParams) {
    navigateToPayment(storedParams.planMonths, storedParams.paymentMethodId);
  }
  else {
    // Fallback navigation
    navigateTo('/checkout/pay/method');
  }
}

/**
 * Handle navigation back to payment selection
 */
function handleBackToSelection(): void {
  navigateTo('/checkout/pay/method');
}

/**
 * Initialize the 3D Secure process
 */
async function initializeProcess(): Promise<void> {
  // Get stored parameters
  const storedParams = getStoredParams();

  if (!storedParams) {
    // No valid parameters found
    return;
  }

  set(params, storedParams);

  try {
    // Initialize Braintree
    await initialize(storedParams);

    // Start verification automatically
    const payEvent = await verify(storedParams);

    // If verification succeeds, finalize payment with API call
    const result = await paymentApi.pay({
      months: payEvent.months,
      paymentMethodNonce: payEvent.nonce,
    });

    if (result.isError) {
      throw new Error(result.error.message);
    }

    // Request account refresh after successful payment
    requestRefresh();

    // Clear stored data and redirect to success page
    clearStoredData();
    await navigateTo('/checkout/success');
  }
  catch (initError) {
    // Error is handled by the composable
    console.error('3D Secure process failed:', initError);
  }
}

// Initialize on mount
onBeforeMount(async () => {
  await initializeProcess();
});

// Cleanup on unmount
onUnmounted(() => {
  cleanup();
});

// Prevent navigation away during processing and clean up data
onBeforeRouteLeave((to, from, next) => {
  if (get(isProcessing)) {
    // Allow navigation but clean up resources
    cleanup();
    clearStoredData();
    next();
  }
  else {
    // Always clear stored data when leaving the page
    cleanup();
    clearStoredData();
    next();
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-2xl min-h-[60vh]">
    <!-- Page Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold mb-2">
        {{ t('subscription.3d_secure.page_title') }}
      </h1>
      <p class="text-rui-text-secondary max-w-md mx-auto">
        {{ t('subscription.3d_secure.page_description') }}
      </p>
    </div>

    <!-- Loading States -->
    <LoadingState
      v-if="isProcessing"
      :state="state"
      :challenge-visible="challengeVisible"
    />

    <!-- Error State -->
    <ErrorState
      v-else-if="state === 'error' && hasValidParams"
      :error="error"
      :can-retry="canRetry"
      @retry="handleRetry()"
      @back="handleBack()"
    />

    <!-- Invalid Parameters State -->
    <InvalidParamsState
      v-else
      @back-to-selection="handleBackToSelection()"
    />
  </div>
</template>

<script setup lang="ts">
import type { ThreeDSecureParams } from '@rotki/card-payment-common/schemas/three-d-secure';
import { get, set } from '@vueuse/core';
import ErrorState from '~/modules/checkout/components/card/CardPaymentError.vue';
import InvalidParamsState from '~/modules/checkout/components/card/CardPaymentInvalid.vue';
import LoadingState from '~/modules/checkout/components/card/CardPaymentLoading.vue';
import CheckoutDescription from '~/modules/checkout/components/common/CheckoutDescription.vue';
import CheckoutTitle from '~/modules/checkout/components/common/CheckoutTitle.vue';
import { useThreeDSecure } from '~/modules/checkout/composables/use-three-d-secure';
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: [
    'maintenance',
    'authentication',
    'unverified',
    'subscriber-or-upgrade',
  ],
});

const { t } = useI18n({ useScope: 'global' });

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

const {
  state,
  error,
  challengeVisible,
  isProcessing,
  paymentInfo,
  initializeProcess,
  cleanup,
  clearStoredData,
} = useThreeDSecure();

const params = ref<ThreeDSecureParams>();
const hasValidParams = computed<boolean>(() => !!get(params));

/**
 * Handle navigation back to appropriate payment page
 * - If we have valid params: go to card page for the plan
 * - If no valid params: go to payment method selection
 */
function handleBack(): void {
  const storedParams = get(params);
  if (storedParams) {
    window.location.href = `/checkout/pay/card?planId=${storedParams.planId}`;
  }
  else {
    navigateTo('/checkout/pay/method');
  }
}

/**
 * Start the 3D Secure process on page load
 */
async function startProcess(): Promise<void> {
  const result = await initializeProcess();

  if (result.success) {
    await navigateTo('/checkout/success');
  }
  else if (result.params) {
    set(params, result.params);
  }
}

onBeforeMount(async () => {
  await startProcess();
});

onUnmounted(() => {
  cleanup();
});

onBeforeRouteLeave((to, from, next) => {
  if (get(isProcessing)) {
    cleanup();
    clearStoredData();
    next();
  }
  else {
    cleanup();
    clearStoredData();
    next();
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-2xl lg:max-w-6xl min-h-[60vh]">
    <!-- Page Header -->
    <div class="mb-6">
      <CheckoutTitle>
        {{ t('subscription.3d_secure.page_title') }}
      </CheckoutTitle>
      <CheckoutDescription>
        {{ t('subscription.3d_secure.page_description') }}
      </CheckoutDescription>
    </div>

    <!-- Loading States -->
    <LoadingState
      v-if="isProcessing"
      :state="state"
      :challenge-visible="challengeVisible"
      :payment-info="paymentInfo"
    />

    <!-- Error State -->
    <ErrorState
      v-else-if="state === 'error' && hasValidParams"
      :error="error"
      @back="handleBack()"
    />

    <!-- Invalid Parameters State -->
    <InvalidParamsState
      v-else
      @back-to-selection="handleBack()"
    />
  </div>
</template>

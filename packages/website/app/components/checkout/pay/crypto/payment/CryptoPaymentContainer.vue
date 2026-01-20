<script setup lang="ts">
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get } from '@vueuse/shared';
import CheckoutDescription from '~/components/checkout/common/CheckoutDescription.vue';
import PaymentLayout from '~/components/checkout/common/PaymentLayout.vue';
import CryptoPaymentActions from '~/components/checkout/pay/crypto/payment/CryptoPaymentActions.vue';
import CryptoPaymentForm from '~/components/checkout/pay/crypto/payment/CryptoPaymentForm.vue';
import CryptoPaymentStatus from '~/components/checkout/pay/crypto/payment/CryptoPaymentStatus.vue';
import { useCheckout } from '~/composables/checkout/use-checkout';
import { useCryptoCheckoutFlow } from '~/composables/checkout/use-crypto-checkout-flow';

const { t } = useI18n({ useScope: 'global' });

const {
  loading,
  cryptoPaymentData,
  effectiveSelectedPlan,
  paymentStep,
  error,
  setCryptoMode,
} = useCheckout();

const { initialize, switchPlan, cancelAndGoBack } = useCryptoCheckoutFlow();

/**
 * Handle payment method change
 */
async function handlePaymentMethodChange(): Promise<void> {
  await cancelAndGoBack();
}

/**
 * Handle internal plan change without route navigation
 */
async function handleInternalPlanChange(newPlan: SelectedPlan): Promise<void> {
  await switchPlan(newPlan);
}

/**
 * Navigate to products page
 */
async function navigateToProducts(): Promise<void> {
  await navigateTo('/products');
}

/**
 * Initialize crypto payment on mount
 */
onMounted(async () => {
  // Set crypto mode for proper pricing display
  setCryptoMode(true);

  const success = await initialize();

  if (!success && !get(cryptoPaymentData)) {
    await navigateToProducts();
  }
});

// Clean up on unmount
onUnmounted(() => {
  setCryptoMode(false);
});
</script>

<template>
  <PaymentLayout hide-sidebar>
    <template #description>
      <CheckoutDescription>
        {{ t('home.plans.tiers.step_3.subtitle') }}
      </CheckoutDescription>
    </template>

    <CryptoPaymentStatus :status="paymentStep" />

    <CryptoPaymentForm
      v-if="cryptoPaymentData && effectiveSelectedPlan"
      :data="cryptoPaymentData"
      :plan="effectiveSelectedPlan"
      @change="handlePaymentMethodChange()"
      @plan-change="handleInternalPlanChange($event)"
    />

    <CryptoPaymentActions
      v-else
      :loading="loading"
      :error="error?.message"
      @back="cancelAndGoBack()"
    />
  </PaymentLayout>
</template>

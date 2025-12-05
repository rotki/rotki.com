<script setup lang="ts">
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get } from '@vueuse/shared';
import CheckoutDescription from '~/components/checkout/common/CheckoutDescription.vue';
import PaymentFrame from '~/components/checkout/common/PaymentFrame.vue';
import CryptoPaymentActions from '~/components/checkout/pay/crypto/payment/CryptoPaymentActions.vue';
import CryptoPaymentForm from '~/components/checkout/pay/crypto/payment/CryptoPaymentForm.vue';
import CryptoPaymentStatus from '~/components/checkout/pay/crypto/payment/CryptoPaymentStatus.vue';
import { useCryptoPaymentFlow } from '~/composables/checkout/use-crypto-payment-flow';
import { useCryptoPaymentNavigation } from '~/composables/checkout/use-crypto-payment-navigation';
import { useCryptoPaymentState } from '~/composables/checkout/use-crypto-payment-state';
import { useCurrencyParams, useDiscountCodeParams } from '~/composables/checkout/use-plan-params';

const { t } = useI18n({ useScope: 'global' });

const {
  loading,
  cryptoPaymentData,
  selectedPlan,
  paymentStep,
  setError,
  errorMessage,
} = useCryptoPaymentState();

const navigation = useCryptoPaymentNavigation();

const { currency } = useCurrencyParams();
const { discountCode } = useDiscountCodeParams();

const flow = useCryptoPaymentFlow(currency, navigation.usedSubscriptionId, discountCode);

/**
 * Handle payment method change
 */
async function handlePaymentMethodChange(): Promise<void> {
  const success = await flow.handlePaymentMethodChange();
  if (success) {
    await navigation.navigateBack(get(discountCode));
  }
}

/**
 * Handle internal plan change without route navigation
 */
async function handleInternalPlanChange(newPlan: SelectedPlan): Promise<void> {
  await flow.switchToNewPlan(newPlan);
}

/**
 * Initialize crypto payment on mount
 */
onMounted(async () => {
  const success = await flow.initialize();

  if (!success) {
    await navigation.navigateToProducts();
  }
});
</script>

<template>
  <PaymentFrame
    v-model:step="paymentStep"
    :loading="loading"
    wide
    @clear-errors="setError('')"
  >
    <template #description>
      <CheckoutDescription>
        {{ t('home.plans.tiers.step_3.subtitle') }}
      </CheckoutDescription>
    </template>

    <template #default="{ status }">
      <CryptoPaymentStatus :status="status" />

      <CryptoPaymentForm
        v-if="cryptoPaymentData && selectedPlan"
        :data="cryptoPaymentData"
        :plan="selectedPlan"
        :discount-code="discountCode"
        @change="handlePaymentMethodChange()"
        @plan-change="handleInternalPlanChange($event)"
      />

      <CryptoPaymentActions
        v-else
        :loading="loading"
        :error="errorMessage"
        @back="navigation.navigateBack()"
      />
    </template>
  </PaymentFrame>
</template>

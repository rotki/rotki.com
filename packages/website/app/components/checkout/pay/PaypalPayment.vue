<script setup lang="ts">
import { get, set, until } from '@vueuse/shared';
import PaymentLayout from '~/components/checkout/common/PaymentLayout.vue';
import AcceptRefundPolicy from '~/components/checkout/pay/AcceptRefundPolicy.vue';
import { useBraintreeClient } from '~/composables/checkout/use-braintree-client';
import { useCheckout } from '~/composables/checkout/use-checkout';
import { usePaypalPayment } from '~/composables/checkout/use-paypal-payment';
import { useReferralCodeParam, useSubscriptionIdParam } from '~/composables/checkout/use-plan-params';
import { buildQueryParams } from '~/utils/query';

const { t } = useI18n({ useScope: 'global' });

const accepted = ref<boolean>(false);
const initializing = ref<boolean>(false);

const {
  braintreeToken,
  planId,
  step,
  loading,
} = useCheckout();

const { client, clientInitializing, initializeClientWithToken } = useBraintreeClient();
const { initPaypal, paying } = usePaypalPayment();
const { upgradeSubId } = useSubscriptionIdParam();
const { referralCode } = useReferralCodeParam();

const pending = computed<boolean>(() => get(step) === 'pending');
const processing = computed<boolean>(() => get(paying) || get(pending) || get(loading));

// Initialize Braintree client when token is available
watch(braintreeToken, (token) => {
  if (token && !get(client)) {
    initializeClientWithToken(token);
  }
}, { immediate: true });

async function navigateBack(): Promise<void> {
  if (get(upgradeSubId)) {
    await navigateTo({
      name: 'home-subscription',
    });
    return;
  }

  const query = buildQueryParams({
    planId: get(planId),
    ref: get(referralCode),
  });

  await navigateTo({
    name: 'checkout-pay-method',
    query,
  });
}

onMounted(async () => {
  try {
    set(initializing, true);
    // Wait for Braintree client to be ready before initializing PayPal
    await until(client).toBeTruthy();
    await initPaypal({ accepted });
  }
  catch (error_: any) {
    console.error('Failed to initialize PayPal:', error_);
  }
  finally {
    set(initializing, false);
  }
});
</script>

<template>
  <PaymentLayout>
    <RuiCard class="min-h-64">
      <AcceptRefundPolicy
        v-model="accepted"
        :disabled="processing || initializing"
        class="mb-4"
      />

      <div
        id="paypal-button"
        :class="[
          { 'opacity-50 cursor-not-allowed pointer-events-none': !accepted || processing },
        ]"
      />

      <div
        v-if="pending"
        class="mt-4"
      >
        <RuiAlert type="info">
          <template #title>
            {{ t('subscription.progress.payment_progress') }}
          </template>
          <span>{{ t('subscription.progress.payment_progress_wait') }}</span>
        </RuiAlert>
      </div>
    </RuiCard>

    <!-- Action Buttons -->
    <div class="flex gap-4 justify-center w-full mt-8 mx-auto max-w-[27.5rem]">
      <RuiButton
        :disabled="processing"
        :loading="pending || initializing || clientInitializing"
        class="w-full"
        size="lg"
        @click="navigateBack()"
      >
        <template #prepend>
          <RuiIcon
            name="lu-arrow-left"
            size="16"
          />
        </template>
        {{ t('actions.back') }}
      </RuiButton>
    </div>
  </PaymentLayout>
</template>

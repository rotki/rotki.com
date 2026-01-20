<script lang="ts" setup>
import { get, isDefined, set } from '@vueuse/shared';
import PaymentLayout from '~/components/checkout/common/PaymentLayout.vue';
import AcceptRefundPolicy from '~/components/checkout/pay/AcceptRefundPolicy.vue';
import CryptoPaymentInfo from '~/components/checkout/pay/crypto/payment/CryptoPaymentInfo.vue';
import CryptoAssetSelector from '~/components/checkout/pay/crypto/request/CryptoAssetSelector.vue';
import { useCheckout } from '~/composables/checkout/use-checkout';
import { buildQueryParams } from '~/utils/query';

const { t } = useI18n({ useScope: 'global' });

const isRefundPolicyAccepted = ref<boolean>(false);
const processing = ref<boolean>(false);
const selectedCurrency = ref<string>('');

const {
  planId,
  subscriptionId,
  upgradeSubId,
  referralCode,
  appliedDiscountCode,
  setCryptoMode,
  fetchBreakdown,
} = useCheckout();

const valid = computed<boolean>(() => get(isRefundPolicyAccepted) && !!get(selectedCurrency));

// Set crypto mode on mount to show crypto pricing in sidebar
onMounted(() => {
  setCryptoMode(true);
  fetchBreakdown();
});

// Clean up crypto mode on unmount
onUnmounted(() => {
  setCryptoMode(false);
});

async function back(): Promise<void> {
  if (isDefined(upgradeSubId)) {
    await navigateTo({ name: 'home-subscription' });
    return;
  }

  const query = buildQueryParams({
    planId: get(planId),
    id: get(subscriptionId),
    ref: get(referralCode),
  });

  await navigateTo({
    name: 'checkout-pay-method',
    query,
  });
}

function submit(): void {
  set(processing, true);

  const query = buildQueryParams({
    planId: get(planId),
    currency: get(selectedCurrency),
    id: get(subscriptionId),
    discountCode: get(appliedDiscountCode),
    upgradeSubId: get(upgradeSubId),
  });

  navigateTo({
    name: 'checkout-pay-crypto',
    query,
  });
}
</script>

<template>
  <PaymentLayout>
    <CryptoPaymentInfo class="mb-2" />

    <RuiCard>
      <div class="text-lg font-medium mb-6">
        {{ t('home.plans.tiers.step_3.select_payment') }}
      </div>
      <CryptoAssetSelector v-model="selectedCurrency" />
    </RuiCard>

    <AcceptRefundPolicy
      v-model="isRefundPolicyAccepted"
      class="mt-6"
      :disabled="processing"
    />

    <div class="flex gap-4 justify-center w-full mt-6 max-w-[27.5rem] mx-auto">
      <RuiButton
        v-if="!subscriptionId"
        :disabled="processing"
        class="w-full"
        size="lg"
        @click="back()"
      >
        <template #prepend>
          <RuiIcon
            name="lu-arrow-left"
            size="16"
          />
        </template>
        {{ t('actions.back') }}
      </RuiButton>
      <RuiButton
        :disabled="!valid"
        :loading="processing"
        class="w-full"
        color="primary"
        size="lg"
        @click="submit()"
      >
        {{ t('actions.continue') }}
      </RuiButton>
    </div>
  </PaymentLayout>
</template>

<script lang="ts" setup>
import { buildOrderSummary } from '@rotki/card-payment-common/utils/order-summary';
import PaymentPage from '@rotki/checkout-ui/components/PaymentPage.vue';
import PolicyConsent from '@rotki/checkout-ui/components/PolicyConsent.vue';
import { get, set } from '@vueuse/shared';
import CheckoutErrorAlert from '~/modules/checkout/components/common/CheckoutErrorAlert.vue';
import CheckoutLoadingOverlay from '~/modules/checkout/components/common/CheckoutLoadingOverlay.vue';
import OrderSummaryCard from '~/modules/checkout/components/common/OrderSummaryCard.vue';
import CryptoAssetSelector from '~/modules/checkout/components/crypto/CryptoAssetSelector.vue';
import CheckoutMethodTiles from '~/modules/checkout/components/method/CheckoutMethodTiles.vue';
import { useCheckout } from '~/modules/checkout/composables/use-checkout';
import { buildQueryParams } from '~/utils/query';

const { t } = useI18n({ useScope: 'global' });

const isRefundPolicyAccepted = ref<boolean>(false);
const processing = ref<boolean>(false);
const selectedCurrency = ref<string>('');

const {
  planId,
  subscriptionId,
  upgradeSubId,
  appliedDiscountCode,
  fetchBreakdown,
  breakdownLoading,
  selectedPlan,
  breakdown,
  isCrypto,
  modelDiscountCode,
  applyDiscount,
  error,
  loading: checkoutLoading,
  clearError,
  ensureAvailablePlans,
  switchPlan,
  planSwitchLoading,
} = useCheckout();

const loading = computed<boolean>(() => get(planSwitchLoading) || get(breakdownLoading) || get(checkoutLoading));

onMounted(async () => {
  await Promise.all([ensureAvailablePlans(), fetchBreakdown()]);
});

const valid = computed<boolean>(() => get(isRefundPolicyAccepted) && !!get(selectedCurrency));

const total = computed<string | undefined>(() => {
  const plan = get(selectedPlan);
  return plan ? buildOrderSummary({ plan, breakdown: get(breakdown), upgrade: !!get(upgradeSubId) }).dueToday.formatted : undefined;
});

const panelClass = 'flex flex-col gap-4 p-4 md:p-6 rounded-rui-card';

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
  <PaymentPage
    :total="total"
    :total-note="t('checkout_crypto.paid_in_crypto')"
  >
    <template #alert>
      <CheckoutErrorAlert
        :error="error"
        @dismiss="clearError()"
      />
    </template>

    <template #methods>
      <CheckoutMethodTiles current="crypto" />
    </template>

    <section
      aria-labelledby="crypto-asset-title"
      class="bg-rui-surface border border-rui-divider"
      :class="[panelClass]"
      data-cy="crypto-panel"
    >
      <h2
        id="crypto-asset-title"
        class="text-lg md:text-xl font-semibold text-rui-text"
      >
        {{ t('checkout_crypto.choose_title') }}
      </h2>
      <CryptoAssetSelector v-model="selectedCurrency" />
      <p class="text-sm text-rui-text-secondary">
        {{ t('checkout_crypto.hold_price') }}
      </p>
      <PolicyConsent
        v-model="isRefundPolicyAccepted"
        policy-href="/refund-policy"
        :disabled="processing || loading"
      />
      <RuiButton
        :disabled="!valid || loading"
        :loading="processing"
        class="w-full sm:w-auto sm:self-start"
        color="primary"
        size="lg"
        data-cy="show-payment-details"
        @click="submit()"
      >
        {{ t('checkout_crypto.show_details') }}
      </RuiButton>
    </section>

    <section
      class="gap-1! border border-dashed border-rui-outline"
      :class="[panelClass]"
      data-cy="crypto-send-placeholder"
    >
      <h2 class="text-lg md:text-xl font-semibold text-rui-text-secondary">
        {{ t('checkout_crypto.send_step') }}
      </h2>
      <p class="text-sm text-rui-text-secondary">
        {{ t('checkout_crypto.send_placeholder') }}
      </p>
    </section>

    <template #summary>
      <OrderSummaryCard
        v-model:discount-code="modelDiscountCode"
        :selected-plan="selectedPlan"
        :breakdown="breakdown"
        :upgrade-sub-id="upgradeSubId"
        :is-crypto="isCrypto"
        :loading="loading"
        :disabled="planSwitchLoading"
        @plan-change="switchPlan($event)"
        @apply-discount="applyDiscount()"
      />
    </template>
  </PaymentPage>

  <CheckoutLoadingOverlay :loading="loading" />
</template>

<script setup lang="ts">
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { CryptoPayment } from '~/types';
import PaymentPage from '@rotki/checkout-ui/components/PaymentPage.vue';
import { useOrderTotals } from '@rotki/checkout-ui/composables/order-totals';
import { get } from '@vueuse/shared';
import OrderSummaryCard from '~/modules/checkout/components/common/OrderSummaryCard.vue';
import CryptoAssetPanel from '~/modules/checkout/components/crypto/CryptoAssetPanel.vue';
import CryptoSendPanel from '~/modules/checkout/components/crypto/CryptoSendPanel.vue';
import { purchaseDiscount, useCompletePurchase } from '~/modules/checkout/composables/use-complete-purchase';
import { type CryptoPaymentLabels, cryptoPaymentLabels } from '~/modules/checkout/utils/crypto-payment-labels';

const modelDiscountCode = defineModel<string>('discountCode', { required: true });

const {
  data,
  plan,
  planSwitchLoading,
  web3ProcessingLoading,
  upgradeSubId,
  breakdown,
} = defineProps<{
  data: CryptoPayment;
  plan: SelectedPlan;
  planSwitchLoading: boolean;
  web3ProcessingLoading: boolean;
  upgradeSubId?: string;
  breakdown?: PaymentBreakdownResponse;
}>();

const emit = defineEmits<{
  'change': [];
  'plan-change': [plan: SelectedPlan];
  'apply-discount': [];
  'error': [message: string];
}>();

defineSlots<{
  /** A page-level error, shown under the heading. */
  alert?: () => any;
}>();

const { t } = useI18n({ useScope: 'global' });

/** A wallet payment is in flight. */
const paying = ref<boolean>(false);

const { total } = useOrderTotals({ plan: () => plan, breakdown: () => breakdown, upgrade: () => !!upgradeSubId });

const { completePurchase } = useCompletePurchase();

const labels = computed<CryptoPaymentLabels>(() => cryptoPaymentLabels(data));

/** Something on the page is already changing the order or paying for it. */
const locked = computed<boolean>(() => planSwitchLoading || web3ProcessingLoading || get(paying));

async function navigateToSuccess(): Promise<void> {
  completePurchase({
    method: 'crypto',
    plan,
    paid: breakdown?.finalAmount,
    renewingPrice: breakdown?.renewingPrice,
    upgrade: !!upgradeSubId,
    discount: purchaseDiscount(breakdown?.discount),
  });
  await navigateTo({ name: 'checkout-success' });
}
</script>

<template>
  <PaymentPage
    :title="t('checkout_crypto.send_title')"
    :total="total"
    :total-note="t('checkout_crypto.amount_on_network', { amount: labels.amount, network: labels.network })"
  >
    <template
      v-if="$slots.alert"
      #alert
    >
      <slot name="alert" />
    </template>

    <CryptoAssetPanel
      :data="data"
      :disabled="locked"
      @change="emit('change')"
    />

    <CryptoSendPanel
      v-model:busy="paying"
      :data="data"
      :upgrade="!!upgradeSubId"
      :disabled="planSwitchLoading || web3ProcessingLoading"
      @paid="navigateToSuccess()"
      @error="emit('error', $event)"
    />

    <template #summary>
      <OrderSummaryCard
        v-model:discount-code="modelDiscountCode"
        warning
        :selected-plan="plan"
        :breakdown="breakdown"
        :upgrade-sub-id="upgradeSubId"
        is-crypto
        :loading="planSwitchLoading"
        :disabled="locked"
        @plan-change="emit('plan-change', $event)"
        @apply-discount="emit('apply-discount')"
      />
    </template>
  </PaymentPage>
</template>

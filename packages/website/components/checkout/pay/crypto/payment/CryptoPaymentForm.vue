<script setup lang="ts">
import type { DiscountInfo } from '@rotki/card-payment-common/schemas/discount';
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { WatchHandle } from 'vue';
import type { CryptoPayment } from '~/types';
import { get, set } from '@vueuse/core';
import ChangeCryptoPayment from '~/components/checkout/pay/crypto/ChangeCryptoPayment.vue';
import CryptoPaymentDetails from '~/components/checkout/pay/crypto/payment/CryptoPaymentDetails.vue';
import CryptoPaymentQr from '~/components/checkout/pay/crypto/payment/CryptoPaymentQr.vue';
import CryptoWalletActions from '~/components/checkout/pay/crypto/payment/CryptoWalletActions.vue';
import PaymentGrandTotal from '~/components/checkout/pay/PaymentGrandTotal.vue';
import { useCryptoPaymentNavigation } from '~/composables/use-crypto-payment-navigation';
import { useCryptoPaymentState } from '~/composables/use-crypto-payment-state';

const props = defineProps<{
  data: CryptoPayment;
  plan: SelectedPlan;
  discountCode?: string;
}>();

const emit = defineEmits<{
  'change': [];
  'plan-change': [plan: SelectedPlan];
}>();

const { data, plan, discountCode } = toRefs(props);

const showChangePaymentDialog = ref<boolean>(false);
const discountCodeModel = ref<string>('');
const discountInfo = ref<DiscountInfo>();

let stopWatcher: WatchHandle;

const { t } = useI18n({ useScope: 'global' });
const router = useRouter();
const navigation = useCryptoPaymentNavigation();
const { upgradeSubId } = navigation;

// Use shared state for error and payment state management
const { errorMessage, paymentState, planSwitchLoading, web3ProcessingLoading } = useCryptoPaymentState();

// Get Web3 payment functionality
const {
  connected,
  address,
  pay,
  isOpen,
  open,
  isExpectedChain,
  switchNetwork,
} = useWeb3Payment(data, paymentState, errorMessage);

// Computed properties
const isBtc = computed<boolean>(() => get(data).chainName === 'bitcoin');

const grandTotal = computed<number>(() => get(data).finalPriceInEur);

// Success redirect handler
function redirect(): void {
  navigation.navigateToSuccess();
  stopWatcher?.();
}

// Watch for success and redirect
stopWatcher = watchEffect(() => {
  const currentState = get(paymentState);
  if (currentState === 'success') {
    redirect();
  }
});

// Discount code handling
watchImmediate(discountCode, (discountCode) => {
  if (discountCode) {
    set(discountCodeModel, discountCode);
  }
});

watch(discountCodeModel, (curr, prev) => {
  if (curr === prev || curr === get(discountCode)) {
    return;
  }

  const currentRoute = get(router.currentRoute);

  navigateTo({
    path: currentRoute.path,
    query: {
      ...currentRoute.query,
      discountCode: curr,
    },
  });
});

// Handle internal plan changes (emit to parent instead of route navigation)
function handleInternalPlanChange(newPlan: SelectedPlan): void {
  emit('plan-change', newPlan);
}
</script>

<template>
  <div class="flex flex-col grow">
    <!-- Plan and Discount Section -->
    <div class="mb-4">
      <SelectedPlanOverview
        :plan="plan"
        crypto
        :disabled="planSwitchLoading || web3ProcessingLoading"
        :loading="planSwitchLoading"
        internal-mode
        warning
        :upgrade="!!upgradeSubId"
        @plan-change="handleInternalPlanChange($event)"
      />

      <DiscountCodeInput
        v-if="!upgradeSubId"
        v-model="discountCodeModel"
        v-model:discount-info="discountInfo"
        :plan="plan"
        :disabled="planSwitchLoading || web3ProcessingLoading"
        class="mt-6"
      />

      <PaymentGrandTotal
        :grand-total="grandTotal"
        :upgrade="!!upgradeSubId"
        :loading="planSwitchLoading"
        class="mt-6"
      />
    </div>

    <!-- QR Code Section -->
    <CryptoPaymentQr
      :data="data"
      :is-wallet-open="isOpen"
      :loading="planSwitchLoading"
    />

    <!-- Payment Details Section -->
    <CryptoPaymentDetails
      :data="data"
      :loading="planSwitchLoading"
      class="mt-8"
    />

    <RuiDivider class="mt-8" />

    <!-- Instructions -->
    <div class="text-rui-text mt-6 mb-6 text-sm">
      {{ t('home.plans.tiers.step_3.wallet.notice') }}

      <div class="font-bold mt-3">
        <p>
          {{ t('home.plans.tiers.step_3.wallet.paid_notice_1') }}
        </p>
        <p>
          {{ t('home.plans.tiers.step_3.wallet.paid_notice_2') }}
        </p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="my-4 flex flex-col sm:flex-row gap-4">
      <div class="grow">
        <RuiButton
          :disabled="planSwitchLoading || web3ProcessingLoading"
          size="lg"
          class="w-full"
          @click="showChangePaymentDialog = true"
        >
          {{ t('home.plans.tiers.step_3.change_payment.title') }}
        </RuiButton>
      </div>

      <!-- Wallet Actions (only for non-Bitcoin) -->
      <div
        v-if="!isBtc"
        class="grow"
      >
        <CryptoWalletActions
          :connected="connected"
          :address="address"
          :is-expected-chain="isExpectedChain"
          :processing="web3ProcessingLoading || planSwitchLoading"
          @connect="open()"
          @pay="pay(!!upgradeSubId)"
          @switch-network="switchNetwork()"
          @open-wallet="open()"
        />
      </div>
    </div>
  </div>

  <!-- Change Payment Dialog -->
  <ChangeCryptoPayment
    v-model="showChangePaymentDialog"
    @change="emit('change')"
  />
</template>

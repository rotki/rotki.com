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
  <div>
    <div class="flex flex-col gap-8 md:gap-10 xl:grid xl:grid-cols-[1.5fr_1fr] xl:gap-12 xl:items-start">
      <!-- Main Content (Left Column) -->
      <div class="flex flex-col gap-6 min-w-0">
        <!-- QR Code + Payment Details Section -->
        <RuiCard>
          <CryptoPaymentQr
            :data="data"
            :is-wallet-open="isOpen"
            :loading="planSwitchLoading"
          />

          <RuiDivider class="my-6" />

          <CryptoPaymentDetails
            :data="data"
            :loading="planSwitchLoading"
          />
        </RuiCard>

        <!-- Instructions -->
        <RuiAlert
          type="info"
          class="text-sm"
        >
          <div>
            {{ t('home.plans.tiers.step_3.wallet.notice') }}
          </div>

          <div class="font-bold mt-3">
            <p>
              {{ t('home.plans.tiers.step_3.wallet.paid_notice_1') }}
            </p>
            <p>
              {{ t('home.plans.tiers.step_3.wallet.paid_notice_2') }}
            </p>
          </div>
        </RuiAlert>
      </div>

      <!-- Sidebar (Right Column) -->
      <aside class="w-full xl:sticky xl:top-8 xl:self-start">
        <OrderSummaryCard
          v-model:discount-code="discountCodeModel"
          v-model:discount-info="discountInfo"
          :plan="plan"
          :upgrade-sub-id="upgradeSubId"
          :checkout-data="data"
          :disabled="planSwitchLoading || web3ProcessingLoading"
          :loading="planSwitchLoading"
          crypto
          internal-mode
          warning
          @plan-change="handleInternalPlanChange($event)"
        />
      </aside>
    </div>

    <!-- Action Buttons (Outside Grid) -->
    <div class="flex flex-col sm:flex-row gap-4 mt-6 mx-auto w-full max-w-[27.5rem]">
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

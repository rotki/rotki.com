<script setup lang="ts">
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { CryptoPayment } from '~/types';
import { get } from '@vueuse/shared';
import OrderSummaryCard from '~/modules/checkout/components/common/OrderSummaryCard.vue';
import ChangeCryptoPayment from '~/modules/checkout/components/crypto/ChangeCryptoPayment.vue';
import CryptoPaymentDetails from '~/modules/checkout/components/crypto/CryptoPaymentDetails.vue';
import CryptoPaymentQr from '~/modules/checkout/components/crypto/CryptoPaymentQr.vue';
import CryptoWalletActions from '~/modules/checkout/components/crypto/CryptoWalletActions.vue';
import { useWeb3Payment } from '~/modules/checkout/composables/use-crypto-payment';

const props = defineProps<{
  data: CryptoPayment;
  plan: SelectedPlan;
  planSwitchLoading: boolean;
  web3ProcessingLoading: boolean;
  upgradeSubId?: string;
  breakdown?: PaymentBreakdownResponse;
  discountCode: string;
}>();

const emit = defineEmits<{
  'change': [];
  'plan-change': [plan: SelectedPlan];
  'apply-discount': [];
  'update:discountCode': [value: string];
  'error': [message: string];
}>();

const { data, planSwitchLoading, web3ProcessingLoading, upgradeSubId, plan, breakdown, discountCode } = toRefs(props);

const showChangePaymentDialog = ref<boolean>(false);

const { t } = useI18n({ useScope: 'global' });

async function navigateToSuccess(): Promise<void> {
  sessionStorage.setItem('payment-completed', 'true');
  await navigateTo({ name: 'checkout-success', query: { crypto: '1' } });
}

const {
  connected,
  address,
  pay,
  processing,
  isOpen,
  open,
  isExpectedChain,
  switchNetwork,
} = useWeb3Payment(data, {
  onSuccess: navigateToSuccess,
  onError: (message: string) => emit('error', message),
});

const isBtc = computed<boolean>(() => get(data).chainName === 'bitcoin');

function handleInternalPlanChange(newPlan: SelectedPlan): void {
  emit('plan-change', newPlan);
}
</script>

<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-8 lg:items-start">
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
    <aside class="w-full lg:sticky lg:top-8 lg:self-start lg:max-w-sm">
      <OrderSummaryCard
        v-model:discount-code="discountCode"
        warning
        :selected-plan="plan"
        :breakdown="breakdown"
        :upgrade-sub-id="upgradeSubId"
        :is-crypto="true"
        :loading="planSwitchLoading"
        :disabled="planSwitchLoading || web3ProcessingLoading || processing"
        @plan-change="handleInternalPlanChange($event)"
        @apply-discount="emit('apply-discount')"
        @update:discount-code="emit('update:discountCode', $event)"
      />
    </aside>
  </div>

  <!-- Action Buttons (Outside Grid) -->
  <div class="flex flex-col sm:flex-row gap-4 mt-6 mx-auto w-full max-w-[27.5rem]">
    <div class="grow">
      <RuiButton
        :disabled="planSwitchLoading || web3ProcessingLoading || processing"
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
        :processing="web3ProcessingLoading || planSwitchLoading || processing"
        @connect="open()"
        @pay="pay(!!upgradeSubId)"
        @switch-network="switchNetwork()"
        @open-wallet="open()"
      />
    </div>
  </div>

  <!-- Change Payment Dialog -->
  <ChangeCryptoPayment
    v-model="showChangePaymentDialog"
    @change="emit('change')"
  />

  <!-- Processing overlay -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-in-out"
      leave-active-class="transition-opacity duration-300 ease-in-out"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      appear
    >
      <div
        v-if="processing"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <div class="flex flex-col items-center justify-center text-center px-4">
          <div class="mb-4">
            <RuiProgress
              variant="indeterminate"
              size="48"
              circular
              color="primary"
            />
          </div>
          <h3 class="text-lg font-medium text-white mb-1">
            {{ t('subscription.progress.payment_progress') }}
          </h3>
          <p class="text-white/80">
            {{ t('subscription.progress.payment_progress_message') }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useAppKitState } from '@reown/appkit/vue';
import { get, set, useClipboard } from '@vueuse/core';
import { parseUnits } from 'ethers';
import { toCanvas } from 'qrcode';
import InputWithCopyButton from '~/components/common/InputWithCopyButton.vue';
import { getChainId } from '~/composables/crypto-payment';
import { toTitleCase, truncateAddress } from '~/utils/text';
import { useLogger } from '~/utils/use-logger';
import type { WatchHandle } from 'vue';
import type { CryptoPayment, PaymentStep } from '~/types';

const props = defineProps<{
  data: CryptoPayment;
  plan: number;
  pending: boolean;
  success: boolean;
  failure: boolean;
  loading: boolean;
  connected: boolean;
  status: PaymentStep;
}>();

const emit = defineEmits<{
  (e: 'change'): void;
  (e: 'pay'): void;
  (e: 'connect'): void;
  (e: 'clear:errors'): void;
}>();

const { data, pending, loading, success } = toRefs(props);

const canvas = useTemplateRef('canvas');
const qrText = ref<string>('');
const showChangePaymentDialog = ref(false);

let stopWatcher: WatchHandle;

const { t } = useI18n();
const config = useRuntimeConfig();
const logger = useLogger('card-payment-form');
const appkitState = useAppKitState();
const { copy: copyToClipboard } = useClipboard({ source: qrText });

const isBtc = computed<boolean>(() => get(data).chainName === 'bitcoin');

const currencyName = computed<string>(() => {
  const { cryptocurrency } = get(data);
  return cryptocurrency.split(':')[1];
});

const paymentAmount = computed<string>(() => {
  const { finalPriceInCrypto } = get(data);
  const currency = get(currencyName);
  return `${finalPriceInCrypto} ${currency}`;
});

const processing = logicOr(pending, loading);

function redirect() {
  navigateTo({ name: 'checkout-success', query: { crypto: '1' } });
  stopWatcher?.();
}

async function createPaymentQR(payment: CryptoPayment, canvas: HTMLCanvasElement) {
  let qrText: string;
  const {
    cryptoAddress,
    chainName,
    finalPriceInCrypto,
    tokenAddress,
    decimals,
  } = payment;

  if (chainName === 'bitcoin') {
    qrText = `bitcoin:${cryptoAddress}?amount=${finalPriceInCrypto}&label=Rotki`;
  }
  else {
    const chainId = getChainId(config.public.testing, payment.chainId);
    const tokenAmount = parseUnits(finalPriceInCrypto, decimals);

    if (!tokenAddress)
      qrText = `ethereum:${cryptoAddress}@${chainId}?value=${tokenAmount}`;
    else
      qrText = `ethereum:${tokenAddress}@${chainId}/transfer?address=${cryptoAddress}&uint256=${tokenAmount}`;
  }

  logger.info(qrText);
  await toCanvas(canvas, qrText);
  return qrText;
}

stopWatcher = watchEffect(() => {
  if (get(success))
    redirect();
});

watch(canvas, async (canvas) => {
  if (!canvas)
    return;

  set(qrText, await createPaymentQR(get(data), canvas));
});
</script>

<template>
  <div :class="$style.wrapper">
    <div :class="$style.qrcode">
      <canvas
        v-if="!appkitState.open"
        ref="canvas"
        @click="copyToClipboard(qrText)"
      />
      <div
        v-else
        :class="$style.canvas"
      />
    </div>
    <div :class="$style.inputs">
      <InputWithCopyButton
        id="price"
        :disabled="processing"
        :model-value="paymentAmount"
        :label="t('common.amount')"
        variant="outlined"
        hide-details
        readonly
        :copy-value="data.finalPriceInCrypto"
      >
        <template #prepend>
          <CryptoAssetIcon
            :icon-url="data.iconUrl"
            :name="currencyName"
          />
        </template>
      </InputWithCopyButton>
      <InputWithCopyButton
        id="address"
        :disabled="processing"
        :model-value="data.cryptoAddress"
        :label="t('home.plans.tiers.step_3.labels.to_address')"
        variant="outlined"
        hide-details
        readonly
        :copy-value="data.cryptoAddress"
      />

      <RuiAlert type="info">
        <div class="flex items-center gap-2">
          <b>{{ t('home.plans.tiers.step_3.labels.network') }}:</b>

          <div class="flex items-center gap-2">
            <CryptoChainIcon :chain="data.chainName" />
            {{ toTitleCase(data.chainName) }}
          </div>
        </div>
        <div
          v-if="data.tokenAddress"
          class="flex gap-2 mt-1"
        >
          <b>{{ t('home.plans.tiers.step_3.labels.token_contract') }}</b>
          <RuiTooltip :open-delay="400">
            <template #activator>
              {{ truncateAddress(data.tokenAddress, 8) }}
            </template>
            {{ data.tokenAddress }}
          </RuiTooltip>
        </div>
      </RuiAlert>
    </div>
    <RuiDivider class="mt-8" />
    <SelectedPlanOverview
      :plan="data"
      :disabled="processing"
      crypto
      warning
    />
    <div :class="$style.hint">
      {{ t('home.plans.tiers.step_3.wallet.notice') }}

      <div :class="$style.info">
        <p>
          {{ t('home.plans.tiers.step_3.wallet.paid_notice_1') }}
        </p>
        <p>
          {{ t('home.plans.tiers.step_3.wallet.paid_notice_2') }}
        </p>
      </div>
    </div>
    <div class="my-4 flex flex-col sm:flex-row gap-4">
      <div class="grow">
        <RuiButton
          :disabled="processing"
          size="lg"
          class="w-full"
          @click="showChangePaymentDialog = true"
        >
          {{ t('home.plans.tiers.step_3.change_payment.title') }}
        </RuiButton>
      </div>
      <div
        v-if="!isBtc"
        class="grow flex gap-1"
      >
        <RuiButton
          v-if="!connected"
          color="primary"
          :loading="processing"
          :disabled="processing"
          size="lg"
          class="w-full"
          @click="emit('connect')"
        >
          {{ t('home.plans.tiers.step_3.wallet.connect_wallet') }}
        </RuiButton>
        <template v-else>
          <RuiButton
            :loading="processing"
            :disabled="processing"
            color="primary"
            size="lg"
            class="w-full"
            @click="emit('pay')"
          >
            {{ t('home.plans.tiers.step_3.wallet.pay_with_wallet') }}
          </RuiButton>

          <RuiButton
            size="lg"
            color="secondary"
            class="!px-3"
            @click="emit('connect')"
          >
            <RuiIcon
              name="link"
              size="20"
            />
          </RuiButton>
        </template>
      </div>
    </div>
  </div>

  <FloatingNotification
    :timeout="10000"
    closeable
    :visible="failure"
    @dismiss="emit('clear:errors')"
  >
    <template #title>
      {{ status?.title }}
    </template>
    {{ status?.message }}
  </FloatingNotification>

  <ChangeCryptoPayment
    v-model="showChangePaymentDialog"
    @change="emit('change')"
  />
</template>

<style lang="scss" module>
.wrapper {
  @apply flex flex-col mt-6 grow;
}

.qrcode {
  @apply border mx-auto mt-2 mb-10;
}

.canvas {
  @apply w-[11.25rem] h-[11.25rem];
}

.inputs {
  @apply flex flex-col justify-center gap-6;
}

.hint {
  @apply text-rui-text mt-6 mb-6 text-sm;
}

.info {
  @apply font-bold mt-3;
}
</style>

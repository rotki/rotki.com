<script setup lang="ts">
import { parseEther, parseUnits } from 'ethers';
import { toCanvas } from 'qrcode';
import { get, set, useClipboard } from '@vueuse/core';
import { logger } from '~/utils/logger';
import type { CryptoPayment, PaymentStep } from '~/types';

const props = defineProps<{
  data: CryptoPayment;
  plan: number;
  pending: boolean;
  success: boolean;
  failure: boolean;
  loading: boolean;
  metamaskSupport: boolean;
  status: PaymentStep;
}>();

const emit = defineEmits<{ (e: 'pay'): void; (e: 'clear:errors'): void }>();

const { t } = useI18n();

const config = useRuntimeConfig();

async function createPaymentQR(payment: CryptoPayment, canvas: HTMLCanvasElement) {
  let qrText = '';
  const chainId = getChainId(!!config.public.testing);
  if (payment.cryptocurrency === 'BTC') {
    qrText = `bitcoin:${payment.cryptoAddress}?amount=${payment.finalPriceInCrypto}&label=Rotki`;
  }
  else if (payment.cryptocurrency === 'ETH') {
    const ethPrice = parseEther(payment.finalPriceInCrypto);
    qrText = `ethereum:${
      payment.cryptoAddress
    }@${chainId}?value=${ethPrice.toString()}`;
  }
  else if (payment.cryptocurrency === 'DAI') {
    const tokenPrice = parseUnits(payment.finalPriceInCrypto, 18);
    qrText = `ethereum:${payment.tokenAddress}@${chainId}/transfer?address=${payment.cryptoAddress}&uint256=${tokenPrice}`;
  }

  logger.info(qrText);
  await toCanvas(canvas, qrText);
  return qrText;
}

const { data, pending, loading, success } = toRefs(props);
const canvas = ref<HTMLCanvasElement>();
const qrText = ref<string>('');

const paymentAmount = computed(() => {
  const { cryptocurrency, finalPriceInCrypto } = get(data);
  return `${finalPriceInCrypto} ${cryptocurrency}`;
});

const processing = computed(() => get(pending) || get(loading));

watch(canvas, async (canvas) => {
  if (!canvas)
    return;

  set(qrText, await createPaymentQR(get(data), canvas));
});

function redirect() {
  navigateTo({ name: 'checkout-success', query: { crypto: '1' } });
  stopWatcher();
}

const stopWatcher = watchEffect(() => {
  if (get(success))
    redirect();
});

const { copy: copyToClipboard } = useClipboard({ source: qrText });
const isBtc = computed(() => get(data).cryptocurrency === 'BTC');

const payWithMetamask = () => emit('pay');
const clearErrors = () => emit('clear:errors');
const css = useCssModule();
</script>

<template>
  <div :class="css.wrapper">
    <div :class="css.qrcode">
      <canvas
        ref="canvas"
        @click="copyToClipboard(qrText)"
      />
    </div>
    <div :class="css.inputs">
      <RuiTextField
        id="price"
        :disabled="processing"
        :model-value="paymentAmount"
        :label="t('common.amount')"
        variant="outlined"
        hide-details
        readonly
      >
        <template #append>
          <CopyButton
            :disabled="processing"
            :model-value="data.finalPriceInCrypto"
          />
        </template>
      </RuiTextField>
      <RuiTextField
        id="address"
        :disabled="processing"
        :model-value="data.cryptoAddress"
        :label="t('common.address')"
        variant="outlined"
        hide-details
        readonly
      >
        <template #append>
          <CopyButton
            :disabled="processing"
            :model-value="data.cryptoAddress"
          />
        </template>
      </RuiTextField>
    </div>
    <SelectedPlanOverview
      :plan="data"
      :disabled="processing"
      crypto
      warning
    />
    <div :class="css.hint">
      {{ t('home.plans.tiers.step_3.metamask.notice') }}

      <div :class="css.info">
        <p>
          {{ t('home.plans.tiers.step_3.metamask.paid_notice_1') }}
        </p>
        <p>
          {{ t('home.plans.tiers.step_3.metamask.paid_notice_2') }}
        </p>
      </div>
    </div>
    <div
      v-if="!isBtc"
      :class="css.button"
    >
      <RuiButton
        :disabled="!metamaskSupport || processing"
        :loading="processing"
        colos="primary"
        size="lg"
        @click="payWithMetamask()"
      >
        <template #prepend>
          <MetamaskIcon class="h-6 w-6 mr-2" />
        </template>
        {{ t('home.plans.tiers.step_3.metamask.action') }}
      </RuiButton>
    </div>
  </div>

  <FloatingNotification
    :timeout="10000"
    :visible="failure"
    @dismiss="clearErrors()"
  >
    <template #title>
      {{ status?.title }}
    </template>
    {{ status?.message }}
  </FloatingNotification>
</template>

<style lang="scss" module>
.wrapper {
  @apply flex flex-col mt-6 grow;
}

.qrcode {
  @apply border mx-auto mt-2 mb-10;
}

.inputs {
  @apply flex flex-col justify-center gap-6;
}

.button {
  @apply my-4;
}

.hint {
  @apply text-rui-text-secondary mt-4 mb-4;
}

.info {
  @apply font-bold mt-3 text-rui-primary;
}
</style>

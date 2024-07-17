<script setup lang="ts">
import { parseUnits } from 'ethers';
import { toCanvas } from 'qrcode';
import { get, set, useClipboard } from '@vueuse/core';
import { useLogger } from '~/utils/use-logger';
import { getChainId } from '~/composables/crypto-payment';
import InputWithCopyButton from '~/components/common/InputWithCopyButton.vue';
import { toTitleCase, truncateAddress } from '~/utils/text';
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

const emit = defineEmits<{
  (e: 'change'): void;
  (e: 'pay'): void;
  (e: 'clear:errors'): void;
}>();

const { t } = useI18n();

const config = useRuntimeConfig();

const logger = useLogger('card-payment-form');

async function createPaymentQR(payment: CryptoPayment, canvas: HTMLCanvasElement) {
  let qrText = '';
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
    const chainId = getChainId(!!config.public.testing, payment.chainId);
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

const { data, pending, loading, success } = toRefs(props);
const canvas = ref<HTMLCanvasElement>();
const qrText = ref<string>('');

const currencyName = computed(() => {
  const { cryptocurrency } = get(data);
  return cryptocurrency.split(':')[1];
});

const paymentAmount = computed(() => {
  const { finalPriceInCrypto } = get(data);
  const currency = get(currencyName);
  return `${finalPriceInCrypto} ${currency}`;
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
const isBtc = computed(() => get(data).chainName === 'bitcoin');

const payWithMetamask = () => emit('pay');
const changePaymentMethod = () => emit('change');
const clearErrors = () => emit('clear:errors');
const css = useCssModule();

const showChangePaymentDialog = ref(false);
</script>

<template>
  <div :class="css.wrapper">
    <div :class="css.qrcode">
      <canvas
        ref="canvas"
        class="canvas"
        @click="copyToClipboard(qrText)"
      />
    </div>
    <div :class="css.inputs">
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
        class="grow"
      >
        <RuiButton
          :disabled="!metamaskSupport || processing"
          :loading="processing"
          color="primary"
          size="lg"
          class="w-full"
          @click="payWithMetamask()"
        >
          <template #prepend>
            <MetamaskIcon class="h-6 w-6 mr-2" />
          </template>
          {{ t('home.plans.tiers.step_3.metamask.action') }}
        </RuiButton>
      </div>
    </div>
  </div>

  <FloatingNotification
    :timeout="10000"
    closeable
    :visible="failure"
    @dismiss="clearErrors()"
  >
    <template #title>
      {{ status?.title }}
    </template>
    {{ status?.message }}
  </FloatingNotification>

  <ChangeCryptoPayment
    v-model="showChangePaymentDialog"
    @change="changePaymentMethod()"
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
  @apply w-[14.25rem] h-[14.25rem];
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

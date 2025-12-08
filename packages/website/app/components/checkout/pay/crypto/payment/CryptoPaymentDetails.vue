<script setup lang="ts">
import type { CryptoPayment } from '~/types';
import { get } from '@vueuse/core';
import CryptoAssetIcon from '~/components/checkout/pay/crypto/CryptoAssetIcon.vue';
import CryptoChainIcon from '~/components/checkout/pay/crypto/CryptoChainIcon.vue';
import InputWithCopyButton from '~/components/common/InputWithCopyButton.vue';
import { toTitleCase, truncateAddress } from '~/utils/text';

const props = defineProps<{
  data: CryptoPayment;
  loading?: boolean;
}>();

const { data, loading } = toRefs(props);
const { t } = useI18n({ useScope: 'global' });

const currencyName = computed<string>(() => {
  const { cryptocurrency } = get(data);
  return cryptocurrency.split(':')[1] ?? '';
});

const paymentAmount = computed<string>(() => {
  const { finalPriceInCrypto } = get(data);
  const currency = get(currencyName);
  return `${finalPriceInCrypto} ${currency}`;
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <InputWithCopyButton
      id="price"
      :model-value="paymentAmount"
      :label="t('common.amount')"
      variant="outlined"
      hide-details
      :loading="loading"
      readonly
      :copy-value="data.finalPriceInCrypto.toString()"
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
</template>

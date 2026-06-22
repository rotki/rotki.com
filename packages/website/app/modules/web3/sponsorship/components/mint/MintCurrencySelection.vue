<script setup lang="ts">
import CryptoAssetIcon from '~/modules/checkout/components/crypto/CryptoAssetIcon.vue';
import { formatTokenBalance } from '~/modules/web3/core/format';

interface Token {
  symbol: string;
  iconUrl: string;
  address: string;
  prices: Record<string, string>;
}

interface Props {
  availableTokens: Token[];
  disabled?: boolean;
  isLoading?: boolean;
  /** Connected wallet's balance of the selected token (human-readable); empty when unknown. */
  balance?: string;
  /** True while the balance is being (re)read — e.g. right after switching currency. */
  balanceLoading?: boolean;
}

const selectedCurrency = defineModel<string>({ required: true });

const { balance = '', balanceLoading = false, disabled = false, isLoading = false } = defineProps<Props>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div
    class="space-y-4"
    :class="{ 'opacity-50 pointer-events-none': disabled }"
  >
    <h6 class="font-bold">
      {{ t('sponsor.sponsor_page.payment_currency') }}
    </h6>
    <div
      v-if="isLoading"
      class="flex flex-wrap gap-2 max-w-full"
    >
      <RuiSkeletonLoader
        v-for="i in 2"
        :key="i"
        class="w-[88px] h-[32px]"
        rounded="md"
      />
    </div>
    <div
      v-else-if="availableTokens.length > 0"
      class="flex flex-wrap gap-2 max-w-full"
    >
      <RuiButton
        v-for="token in availableTokens"
        :key="token.symbol"
        :variant="selectedCurrency === token.symbol ? 'default' : 'outlined'"
        color="primary"
        size="sm"
        @click="selectedCurrency = token.symbol"
      >
        <template #prepend>
          <CryptoAssetIcon
            class="bg-white rounded-full"
            :icon-url="token.iconUrl"
            :name="token.symbol"
          />
        </template>
        {{ token.symbol }}
      </RuiButton>
    </div>
    <div
      v-else
      class="text-rui-text-secondary"
    >
      {{ t('sponsor.sponsor_page.no_payment_tokens_available') }}
    </div>
    <!-- Always rendered so the balance never shifts the layout (reserves one line). -->
    <div
      v-if="!isLoading"
      class="flex items-center gap-1.5 text-sm text-rui-text-secondary h-5"
    >
      <RuiSkeletonLoader
        v-if="balanceLoading"
        class="w-32 h-4"
      />
      <template v-else-if="balance">
        {{ t('sponsor.sponsor_page.wallet_balance', { balance: formatTokenBalance(balance), currency: selectedCurrency }) }}
      </template>
    </div>
  </div>
</template>

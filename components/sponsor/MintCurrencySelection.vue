<script setup lang="ts">
interface Token {
  symbol: string;
  icon_url: string;
  address: string;
  prices: Record<string, string>;
}

interface Props {
  availableTokens: Token[];
  isLoading?: boolean;
}

const selectedCurrency = defineModel<string>({ required: true });

withDefaults(defineProps<Props>(), {
  isLoading: false,
});

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="space-y-4">
    <h6 class="font-bold">
      {{ t('sponsor.sponsor_page.payment_currency') }}
    </h6>
    <div
      v-if="isLoading"
      class="flex gap-2"
    >
      <RuiSkeletonLoader
        v-for="i in 2"
        :key="i"
        class="w-20 h-8"
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
            :icon-url="token.icon_url"
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
  </div>
</template>

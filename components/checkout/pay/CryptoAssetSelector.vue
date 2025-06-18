<script lang="ts" setup>
import { get, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import CryptoChainIcon from '~/components/checkout/pay/CryptoChainIcon.vue';
import { usePaymentCryptoStore } from '~/store/payments/crypto';
import { toTitleCase } from '~/utils/text';

const modelValue = defineModel<string>({ required: true });

const cryptoStore = usePaymentCryptoStore();
const { paymentAssets, paymentAssetsLoading } = storeToRefs(cryptoStore);

interface Item {
  id: string;
  label: string;
  iconUrl?: string;
}

const blockchainItems = computed<Item[]>(() => Object.keys(get(paymentAssets)).map(item => ({
  id: item,
  label: toTitleCase(item),
})));

const selectedChain = ref<string>('');

const tokenItems = computed<Item[]>(() => {
  const chain = get(selectedChain);
  if (!chain)
    return [];

  const items = get(paymentAssets)[chain];

  if (!items)
    return [];

  return Object.entries(items).map(([id, item]) => {
    let label = item.symbol;
    const name = toTitleCase(item.name);
    if (toTitleCase(label) !== name)
      label += ` (${name})`;

    return {
      id,
      label,
      iconUrl: item.iconUrl,
    };
  });
});

const { t } = useI18n({ useScope: 'global' });

const selectedToken = computed({
  get() {
    return get(tokenItems).find(({ id }) => id === get(modelValue)) || null;
  },
  set(item: Item | null) {
    set(modelValue, item ? item.id : '');
  },
});

const hint = computed(() => {
  const chain = get(selectedChain);
  if (!chain)
    return '';

  const items = get(paymentAssets)[chain];

  if (!items)
    return '';

  const address = items[get(modelValue)]?.address;
  if (!address)
    return '';

  return `${t('home.plans.tiers.step_3.labels.token_contract')} ${address}`;
});

watch(tokenItems, (tokens) => {
  if (tokens.length === 1) {
    set(modelValue, tokens[0].id);
  }
});
</script>

<template>
  <RuiCard class="mt-6 bg-rui-grey-50">
    <div class="text-rui-text-secondary text-caption font-medium mb-4 flex items-center gap-2">
      <RuiIcon
        name="lu-link"
        size="14"
      />
      {{ t('home.plans.tiers.step_3.labels.select_network_and_token') }}
    </div>
    <div class="flex flex-col gap-4">
      <RuiAutoComplete
        v-model="selectedChain"
        variant="outlined"
        color="primary"
        :options="blockchainItems"
        :disabled="paymentAssetsLoading"
        auto-select-first
        key-attr="id"
        hide-details
        text-attr="label"
        :label="t('home.plans.tiers.step_3.labels.network')"
      >
        <template #item="{ item }">
          <div class="flex items-center gap-3">
            <CryptoChainIcon :chain="item.id" />
            {{ item.label }}
          </div>
        </template>
        <template #selection="{ item }">
          <div class="flex items-center gap-3">
            <CryptoChainIcon :chain="item.id" />
            {{ item.label }}
          </div>
        </template>
      </RuiAutoComplete>

      <RuiAutoComplete
        v-model="selectedToken"
        variant="outlined"
        color="primary"
        :options="tokenItems"
        :disabled="paymentAssetsLoading || !selectedChain"
        auto-select-first
        key-attr="id"
        hide-details
        text-attr="label"
        :hint="hint"
        return-object
        :label="t('home.plans.tiers.step_3.labels.token')"
      >
        <template #item="{ item }">
          <div class="flex items-center gap-3">
            <CryptoAssetIcon
              :name="item.label"
              :icon-url="item.iconUrl"
            />
            {{ item.label }}
          </div>
        </template>
        <template #selection="{ item }">
          <div class="flex items-center gap-3">
            <CryptoAssetIcon
              :name="item.label"
              :icon-url="item.iconUrl"
            />
            {{ item.label }}
          </div>
        </template>
      </RuiAutoComplete>
    </div>
  </RuiCard>
</template>

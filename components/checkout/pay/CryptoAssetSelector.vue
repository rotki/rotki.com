<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { get } from '@vueuse/core';
import { usePaymentCryptoStore } from '~/store/payments/crypto';
import { toTitleCase } from '~/utils/text';
import CryptoChainIcon from '~/components/checkout/pay/CryptoChainIcon.vue';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const { modelValue } = toRefs(props);

const cryptoStore = usePaymentCryptoStore();
const { paymentAssets, paymentAssetsLoading } = storeToRefs(cryptoStore);

interface Item {
  id: string;
  label: string;
}

const blockchainItems: ComputedRef<Item[]> = computed(() => Object.keys(get(paymentAssets)).map(item => ({
  id: item,
  label: toTitleCase(item),
})));

const selectedChain: Ref<Item | null> = ref(null);

const tokenItems: ComputedRef<Item[]> = computed(() => {
  const chain = get(selectedChain);
  if (!chain)
    return [];

  const items = get(paymentAssets)[chain.id];

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
    };
  });
});

const { t } = useI18n();

const selectedToken = computed({
  get() {
    return get(tokenItems).find(({ id }) => id === get(modelValue)) || null;
  },
  set(item: Item | null) {
    emit('update:modelValue', item ? item.id : '');
  },
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <RuiAutoComplete
      v-model="selectedChain"
      variant="outlined"
      color="primary"
      :data="blockchainItems"
      :disabled="paymentAssetsLoading"
      key-prop="id"
      text-prop="label"
      :label="t('home.plans.tiers.step_3.labels.network')"
    >
      <template #default="{ item }">
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
      :data="tokenItems"
      :disabled="paymentAssetsLoading || !selectedChain"
      key-prop="id"
      text-prop="label"
      :label="t('home.plans.tiers.step_3.labels.token')"
    >
      <template #default="{ item }">
        {{ item.label }}
      </template>
    </RuiAutoComplete>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  chain: string;
}>();

const pending = ref(true);
const error = ref(false);

const { public: { testing } } = useRuntimeConfig();

// Map network names to icon filenames
const CHAIN_NAME_MAP: Record<string, string> = {
  'Arbitrum One': 'arbitrum',
  'Arbitrum Sepolia': 'arbitrum',
  'Base': 'base',
  'Base Sepolia': 'base',
  'Ethereum': 'ethereum',
  'Gnosis': 'gnosis',
  'OP Mainnet': 'optimism',
  'Sepolia': 'ethereum',
  'Scroll': 'scroll',
  'Polygon': 'polygon_pos',
  'BNB Smart Chain': 'binance_sc',
};

const chainName = computed<string>(() => {
  const name = props.chain;

  // Check if there's a mapping for this chain name
  if (name in CHAIN_NAME_MAP) {
    return CHAIN_NAME_MAP[name];
  }

  // Fallback: remove 'sepolia' and trim for testnet chains
  if (!testing) {
    return name.toLowerCase();
  }

  return name.replace(/sepolia/gi, '').trim().toLowerCase();
});
</script>

<template>
  <div class="w-6 h-6">
    <div
      v-if="pending || error"
      class="w-full h-full bg-rui-grey-300 text-rui-grey-700 uppercase rounded-md flex items-center justify-center"
    >
      {{ chain[0] }}
    </div>
    <img
      class="w-full h-full"
      :class="{ hidden: pending || error }"
      :src="`/img/chains/${chainName}.svg`"
      width="24"
      height="24"
      @loadstart="pending = true"
      @load="pending = false"
      @error="
        error = true;
        pending = false;
      "
    />
  </div>
</template>

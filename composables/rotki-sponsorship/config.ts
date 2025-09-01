import { get } from '@vueuse/shared';
import { computed } from 'vue';
import { useSponsorshipMetadataStore } from '~/store/sponsorship-metadata';
import { CHAIN_CONFIGS, FALLBACK_CHAIN, FALLBACK_CONTRACT_ADDRESS } from './constants';

// For client-side usage (composables)
export function useNftConfig() {
  const { chainId, contractAddress, rpcUrl } = storeToRefs(useSponsorshipMetadataStore());

  return {
    CHAIN_ID: computed<number>(() => get(chainId) || CHAIN_CONFIGS[FALLBACK_CHAIN].chainId),
    CONTRACT_ADDRESS: computed<string>(() => get(contractAddress) || FALLBACK_CONTRACT_ADDRESS),
    RPC_URL: computed<string>(() => get(rpcUrl) || CHAIN_CONFIGS[FALLBACK_CHAIN].rpcUrl),
  };
}

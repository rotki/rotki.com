import { get } from '@vueuse/shared';
import { computed } from 'vue';
import { useSponsorshipMetadataStore } from '~/store/sponsorship-metadata';

/** Sponsorship contract chain id and address, for client-side composables. */
export function useNftConfig() {
  const { chainId, contractAddress } = storeToRefs(useSponsorshipMetadataStore());

  return {
    CHAIN_ID: computed<number>(() => get(chainId) ?? 0),
    CONTRACT_ADDRESS: computed<string>(() => get(contractAddress) ?? ''),
  };
}

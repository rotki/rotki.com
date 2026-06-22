import { get, set } from '@vueuse/shared';
import { defineStore } from 'pinia';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { SponsorshipMetadata } from '~/types/sponsor';
import { useLogger } from '~/utils/use-logger';

// Backend chain name → numeric chain id (RPC config lives in modules/web3/core/chains).
const CHAIN_ID_BY_NAME: Record<'ethereum' | 'sepolia', number> = {
  ethereum: 1,
  sepolia: 11155111,
};

export const useSponsorshipMetadataStore = defineStore('sponsorship-metadata', () => {
  // State
  const metadata = ref<SponsorshipMetadata>();
  const loading = ref<boolean>(false);
  const error = ref<Error>();

  // Getters
  const contractAddress = computed<string | undefined>(() => get(metadata)?.contractAddress);
  const chain = computed<'sepolia' | 'ethereum' | undefined>(() => get(metadata)?.chain);

  const chainId = computed<number | undefined>(() => {
    const chainName = get(chain);
    return chainName ? CHAIN_ID_BY_NAME[chainName] : undefined;
  });

  const logger = useLogger('leaderboard-metadata-store');
  const { fetchWithCsrf } = useFetchWithCsrf();

  // Actions
  async function fetchMetadata(): Promise<void> {
    try {
      set(loading, true);
      set(error, undefined);

      const response = await fetchWithCsrf('/webapi/nfts/release/current', {
        method: 'GET',
      });

      const validatedResponse = SponsorshipMetadata.parse(response);
      set(metadata, validatedResponse);
    }
    catch (error_: any) {
      logger.error('Error fetching sponsorship metadata:', error_);
      set(error, error_);
    }
    finally {
      set(loading, false);
    }
  }

  return {
    // Getters (computed — already read-only by nature)
    chain,
    chainId,
    contractAddress,
    // State (Pinia owns these refs; wrapping them in readonly() breaks its
    // $state sync/hydration and emits "target is readonly" warnings)
    error,
    // Actions
    fetchMetadata,
    loading,
    metadata,
  };
});

import { get, set } from '@vueuse/shared';
import { defineStore } from 'pinia';
import { CHAIN_CONFIGS } from '~/composables/rotki-sponsorship/constants';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { SponsorshipMetadata } from '~/types/sponsor';
import { useLogger } from '~/utils/use-logger';

interface ChainConfig {
  chainId: number;
  rpcUrls: readonly string[];
}

export const useSponsorshipMetadataStore = defineStore('sponsorship-metadata', () => {
  // State
  const metadata = ref<SponsorshipMetadata>();
  const loading = ref<boolean>(false);
  const error = ref<Error>();

  // Getters
  const contractAddress = computed<string | undefined>(() => get(metadata)?.contractAddress);
  const chain = computed<'sepolia' | 'ethereum' | undefined>(() => get(metadata)?.chain);

  const chainConfig = computed<ChainConfig | undefined>(() => {
    const chainName = get(chain);
    if (!chainName)
      return undefined;
    return CHAIN_CONFIGS[chainName];
  });

  const chainId = computed<number | undefined>(() => get(chainConfig)?.chainId);

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
    // State
    chain: readonly(chain),
    chainConfig: readonly(chainConfig),
    chainId: readonly(chainId),
    contractAddress: readonly(contractAddress),
    error: readonly(error),
    // Actions
    fetchMetadata,
    loading: readonly(loading),
    metadata: readonly(metadata),
  };
});

import { get, set } from '@vueuse/shared';
import { z } from 'zod';
import { CHAIN_CONFIGS } from '~/composables/rotki-sponsorship/constants';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useLogger } from '~/utils/use-logger';

const LeaderboardMetadataSchema = z.object({
  chain: z.enum(['sepolia', 'ethereum']),
  contractAddress: z.string(),
  lastUpdated: z.string().nullable(),
});

export type LeaderboardMetadata = z.infer<typeof LeaderboardMetadataSchema>;

interface ChainConfig {
  chainId: number;
  rpcUrl: string;
}

export const useLeaderboardMetadataStore = defineStore('leaderboard-metadata', () => {
  // State
  const metadata = ref<LeaderboardMetadata>();
  const loading = ref<boolean>(false);
  const error = ref<Error>();

  // Getters
  const contractAddress = computed<string | undefined>(() => get(metadata)?.contractAddress);
  const lastUpdated = computed<string | null | undefined>(() => get(metadata)?.lastUpdated);
  const chain = computed<'sepolia' | 'ethereum' | undefined>(() => get(metadata)?.chain);

  const chainConfig = computed<ChainConfig | undefined>(() => {
    const chainName = get(chain);
    if (!chainName)
      return undefined;
    return CHAIN_CONFIGS[chainName];
  });

  const chainId = computed<number | undefined>(() => get(chainConfig)?.chainId);
  const rpcUrl = computed<string | undefined>(() => get(chainConfig)?.rpcUrl);

  const logger = useLogger('leaderboard-metadata-store');
  const { fetchWithCsrf } = useFetchWithCsrf();

  // Actions
  async function fetchMetadata(): Promise<void> {
    try {
      set(loading, true);
      set(error, undefined);

      const response = await fetchWithCsrf('/webapi/nfts/leaderboard/metadata/', {
        method: 'GET',
      });

      const validatedResponse = LeaderboardMetadataSchema.parse(response);
      set(metadata, validatedResponse);
    }
    catch (error_: any) {
      logger.error('Error fetching leaderboard metadata:', error_);
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
    lastUpdated: readonly(lastUpdated),
    loading: readonly(loading),
    metadata: readonly(metadata),
    rpcUrl: readonly(rpcUrl),
  };
});

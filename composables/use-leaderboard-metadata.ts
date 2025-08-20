import { get, set } from '@vueuse/shared';
import { computed, ref } from 'vue';
import { z } from 'zod';
import { CHAIN_CONFIGS } from '~/composables/rotki-sponsorship/constants';
import { fetchWithCsrf } from '~/utils/api';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('use-leaderboard-metadata');

const LeaderboardMetadataSchema = z.object({
  chain: z.enum(['sepolia', 'ethereum']),
  contractAddress: z.string(),
  lastUpdated: z.string(),
});

export type LeaderboardMetadata = z.infer<typeof LeaderboardMetadataSchema>;

interface ChainConfig {
  chainId: number;
  rpcUrl: string;
}

const metadata = ref<LeaderboardMetadata>();
const loading = ref<boolean>(false);
const error = ref<Error>();

export function useLeaderboardMetadata() {
  const contractAddress = computed<string | undefined>(() => get(metadata)?.contractAddress);
  const lastUpdated = computed<string | undefined>(() => get(metadata)?.lastUpdated);
  const chain = computed<'sepolia' | 'ethereum' | undefined>(() => get(metadata)?.chain);

  const chainConfig = computed<ChainConfig | undefined>(() => {
    const chainName = get(chain);
    if (!chainName)
      return undefined;
    return CHAIN_CONFIGS[chainName];
  });

  const chainId = computed<number | undefined>(() => get(chainConfig)?.chainId);
  const rpcUrl = computed<string | undefined>(() => get(chainConfig)?.rpcUrl);

  async function fetchMetadata(): Promise<void> {
    try {
      set(loading, true);
      set(error, undefined);

      const response = await fetchWithCsrf('/webapi/leaderboard/metadata/', {
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
    chain,
    chainConfig: readonly(chainConfig),
    chainId: readonly(chainId),
    contractAddress: readonly(contractAddress),
    error: readonly(error),
    fetchMetadata,
    lastUpdated: readonly(lastUpdated),
    loading: readonly(loading),
    metadata: readonly(metadata),
    rpcUrl: readonly(rpcUrl),
  };
}

import { get, set } from '@vueuse/shared';
import { CHAIN_CONFIGS } from '~/composables/rotki-sponsorship/constants';
import { getWorkingRpcUrl } from '~/composables/rotki-sponsorship/rpc-checker';
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
  const workingRpcUrl = ref<string>();
  const rpcCheckPromise = ref<Promise<string>>();

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

  // Get the working RPC URL with fallback logic
  const rpcUrl = computed<string | undefined>(() => {
    const config = get(chainConfig);
    if (!config?.rpcUrls)
      return undefined;

    // If we already have a working URL for this chain, return it
    if (get(workingRpcUrl)) {
      return get(workingRpcUrl);
    }

    // If check is not in progress, start it
    if (!get(rpcCheckPromise)) {
      set(rpcCheckPromise, getWorkingRpcUrl(config.rpcUrls).then((url) => {
        set(workingRpcUrl, url);
        set(rpcCheckPromise, undefined);
        return url;
      }));
    }

    // Return the first URL as immediate fallback while checking
    return config.rpcUrls[0];
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

  // Reset working RPC when chain changes
  watch(chain, () => {
    set(workingRpcUrl, undefined);
    set(rpcCheckPromise, undefined);
  });

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
    rpcUrl: readonly(rpcUrl),
  };
});

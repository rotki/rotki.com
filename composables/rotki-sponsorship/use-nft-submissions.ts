import { set } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { NftSubmissions } from '~/types/sponsor';

export function useNftSubmissions() {
  const submissions = ref<NftSubmissions>([]);
  const isLoading = ref<boolean>(false);
  const error = ref<string>('');

  const logger = useLogger();
  const { fetchWithCsrf } = useFetchWithCsrf();

  const { signMessage: signMessageWeb3 } = useWeb3Connection();

  async function fetchSubmissions(evmAddress: string): Promise<void> {
    if (!evmAddress) {
      set(error, 'Address is required');
      return;
    }

    try {
      set(isLoading, true);
      set(error, '');

      // Generate timestamp for the request
      const timestamp = Math.floor(Date.now() / 1000);

      // Sign a message to prove ownership - matching backend format
      const message = `I am requesting my submission data for ${evmAddress} at ${timestamp}`;
      let signature: string;

      try {
        signature = await signMessageWeb3(message);
      }
      catch (signError: any) {
        // User rejected signature or wallet error
        if (signError?.code === 4001 || signError?.message?.includes('reject')) {
          set(error, 'Signature rejected. Click retry to sign again.');
        }
        else {
          set(error, 'Failed to sign message. Please try again.');
        }
        return;
      }

      const response = await fetchWithCsrf<{ submissions: NftSubmissions }>('/webapi/nfts/holder-submission/retrieve/', {
        body: {
          evmAddress,
          signature,
          timestamp,
        },
        method: 'POST',
      });

      set(submissions, NftSubmissions.parse(response.submissions) || []);
    }
    catch (error_: any) {
      logger.error(error_);
      if (error_.statusCode === 404) {
        set(submissions, []);
      }
      else {
        set(error, error_.data?.error || 'Failed to fetch submissions');
      }
    }
    finally {
      set(isLoading, false);
    }
  }

  return {
    error,
    fetchSubmissions,
    isLoading,
    submissions,
  };
}

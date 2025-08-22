import { set } from '@vueuse/shared';
import { useSiweAuth } from '~/composables/siwe-auth';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { NftSubmissions } from '~/types/sponsor';

export function useNftSubmissions() {
  const submissions = ref<NftSubmissions>([]);
  const isLoading = ref<boolean>(false);
  const error = ref<string>('');

  const logger = useLogger();
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { authenticatedRequest, isAuthenticating } = useSiweAuth();

  async function fetchSubmissions(evmAddress: string): Promise<void> {
    if (!evmAddress) {
      set(error, 'Address is required');
      return;
    }

    try {
      set(isLoading, true);
      set(error, '');

      // Use authenticatedRequest to handle auth and retry logic
      const response = await authenticatedRequest(evmAddress, async () => fetchWithCsrf<{ submissions: NftSubmissions }>('/webapi/nfts/holder-submission/retrieve/', {
        body: {
          evmAddress,
        },
        method: 'POST',
      }));

      set(submissions, NftSubmissions.parse(response.submissions) || []);
    }
    catch (error_: any) {
      logger.error(error_);
      if (error_.statusCode === 404) {
        set(submissions, []);
      }
      else if (error_.message?.includes('Authentication required')) {
        set(error, error_.message);
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
    isAuthenticating,
    isLoading,
    submissions,
  };
}

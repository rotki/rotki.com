import { get, set } from '@vueuse/core';
import { type Client, create } from 'braintree-web/client';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useLogger } from '~/utils/use-logger';

interface BraintreeClientTokenResponse {
  braintreeClientToken: string;
}

interface UseBraintreeClientReturn {
  client: Ref<Client | undefined>;
  clientError: Ref<string | undefined>;
  clientInitializing: Ref<boolean>;
  initializeClient: () => Promise<boolean>;
  teardownClient: () => Promise<void>;
}

/**
 * Braintree client composable for account management
 * Handles fetching client token and initializing Braintree client
 */
export function useBraintreeClient(): UseBraintreeClientReturn {
  const client = ref<Client>();
  const clientError = ref<string>();
  const clientInitializing = ref<boolean>(false);

  const logger = useLogger('braintree-client');
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { t } = useI18n({ useScope: 'global' });

  /**
   * Initialize Braintree client by fetching token and creating client instance
   * @returns true if successful, false if failed (check clientError for details)
   */
  const initializeClient = async (): Promise<boolean> => {
    if (get(client) || get(clientInitializing)) {
      return true;
    }

    set(clientInitializing, true);
    set(clientError, undefined);

    try {
      const tokenResponse = await fetchWithCsrf<BraintreeClientTokenResponse>(
        '/webapi/2/braintree/customer',
        {
          method: 'GET',
        },
      );

      const newClient = await create({
        authorization: tokenResponse.braintreeClientToken,
      });

      set(client, newClient);
      return true;
    }
    catch (error: any) {
      logger.error('Failed to initialize Braintree client:', error);
      set(clientError, error.message || t('subscription.error.init_error'));
      return false;
    }
    finally {
      set(clientInitializing, false);
    }
  };

  /**
   * Teardown Braintree client to clean up resources
   */
  const teardownClient = async (): Promise<void> => {
    try {
      const currentClient = get(client);
      if (currentClient) {
        await currentClient.teardown((err) => {
          if (err) {
            logger.error('Error in teardown callback:', err);
          }
        });
      }
      set(client, undefined);
    }
    catch (error) {
      logger.error('Error during Braintree client cleanup:', error);
    }
  };

  return {
    client,
    clientError,
    clientInitializing,
    initializeClient,
    teardownClient,
  };
}

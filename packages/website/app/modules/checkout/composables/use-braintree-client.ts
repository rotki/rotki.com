import type { Client } from 'braintree-web/client';
import { CheckoutPaymentMethods, CheckoutSteps, parseBraintreeError, PaymentServerEvents } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { type PaymentErrorContext, usePaymentErrorMessage } from '~/modules/checkout/composables/use-payment-error-message';
import { usePaymentLogger } from '~/modules/checkout/composables/use-payment-logger';
import { useLogger } from '~/utils/use-logger';

interface BraintreeClientTokenResponse {
  braintreeClientToken: string;
}

interface UseBraintreeClientReturn {
  client: Readonly<Ref<Client | undefined>>;
  clientError: Readonly<Ref<string | undefined>>;
  clientInitializing: Readonly<Ref<boolean>>;
  initializeClient: () => Promise<boolean>;
  initializeClientWithToken: (token: string) => Promise<boolean>;
  teardownClient: () => Promise<void>;
  reset: () => void;
}

/**
 * Braintree client composable for account management and checkout
 * Handles fetching client token and initializing Braintree client
 *
 * @param errorContext phrasing for `clientError`. The account pages use this
 * client to save a card, where payment wording would be wrong.
 */
export function useBraintreeClient(errorContext: PaymentErrorContext = 'payment'): UseBraintreeClientReturn {
  const client = shallowRef<Client>();
  const clientError = ref<string>();
  const clientInitializing = shallowRef<boolean>(false);

  const logger = useLogger('braintree-client');
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { logPaymentEvent } = usePaymentLogger();
  const { userMessageFor } = usePaymentErrorMessage();
  const { t } = useI18n({ useScope: 'global' });

  /**
   * Initialize Braintree client with a provided token
   * Used by checkout flow where token comes from payment breakdown
   * @param token - The Braintree client token
   * @returns true if successful, false if failed
   */
  const initializeClientWithToken = async (token: string): Promise<boolean> => {
    if (get(client) || get(clientInitializing)) {
      return true;
    }

    if (!token) {
      set(clientError, t('subscription.error.init_error'));
      return false;
    }

    set(clientInitializing, true);
    set(clientError, undefined);

    try {
      const { create } = await import('braintree-web/client');
      const newClient = await create({
        authorization: token,
      });

      set(client, newClient);
      return true;
    }
    catch (error: unknown) {
      logger.error('Failed to initialize Braintree client with token:', error);
      const parsed = parseBraintreeError(error);
      logPaymentEvent({
        paymentMethod: CheckoutPaymentMethods.CARD,
        event: PaymentServerEvents.BRAINTREE_INIT_FAILED,
        errorMessage: parsed.logMessage,
        errorCode: parsed.code,
        step: CheckoutSteps.INIT,
      });
      set(clientError, userMessageFor(parsed, errorContext));
      return false;
    }
    finally {
      set(clientInitializing, false);
    }
  };

  /**
   * Initialize Braintree client by fetching token and creating client instance
   * Used by account management features
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

      const { create } = await import('braintree-web/client');
      const newClient = await create({
        authorization: tokenResponse.braintreeClientToken,
      });

      set(client, newClient);
      return true;
    }
    catch (error: unknown) {
      logger.error('Failed to initialize Braintree client:', error);
      const parsed = parseBraintreeError(error);
      logPaymentEvent({
        paymentMethod: CheckoutPaymentMethods.CARD,
        event: PaymentServerEvents.BRAINTREE_INIT_FAILED,
        errorMessage: parsed.logMessage,
        errorCode: parsed.code,
        step: CheckoutSteps.INIT,
      });
      set(clientError, userMessageFor(parsed, errorContext));
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

  /**
   * Reset client state without teardown (for checkout flow)
   */
  function reset(): void {
    set(client, undefined);
    set(clientError, undefined);
    set(clientInitializing, false);
  }

  return {
    client: shallowReadonly(client),
    clientError: readonly(clientError),
    clientInitializing: readonly(clientInitializing),
    initializeClient,
    initializeClientWithToken,
    reset,
    teardownClient,
  };
}

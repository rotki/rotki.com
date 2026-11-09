import type { PaymentErrorContext } from '@rotki/checkout-ui/utils/payment-error-message';
import type { Client } from 'braintree-web/client';
import { CheckoutPaymentMethods, CheckoutSteps, parseBraintreeError, PaymentServerEvents } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';
import { useBraintreeToken } from '~/modules/checkout/composables/use-braintree-token';
import { usePaymentErrorMessage } from '~/modules/checkout/composables/use-payment-error-message';
import { usePaymentLogger } from '~/modules/checkout/composables/use-payment-logger';
import { useLogger } from '~/utils/use-logger';

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
 * @param errorContext - phrasing for `clientError`. The account pages use this
 * client to save a card, where payment wording would be wrong.
 */
export function useBraintreeClient(errorContext: PaymentErrorContext = 'payment'): UseBraintreeClientReturn {
  const client = shallowRef<Client>();
  const clientError = ref<string>();
  const clientInitializing = shallowRef<boolean>(false);

  const logger = useLogger('braintree-client');
  const { fetchClientToken } = useBraintreeToken();
  const { logPaymentEvent } = usePaymentLogger();
  const { userMessageFor } = usePaymentErrorMessage();
  const { t } = useI18n({ useScope: 'global' });

  /** Creates the client once; a failure ends up in `clientError` and the payment log. */
  async function connect(readToken: () => Promise<string> | string): Promise<boolean> {
    if (get(client) || get(clientInitializing))
      return true;

    set(clientInitializing, true);
    set(clientError, undefined);

    try {
      const authorization = await readToken();
      const { create } = await import('braintree-web/client');
      set(client, await create({ authorization }));
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
  }

  /** For the checkout, where the token comes with the payment breakdown. */
  const initializeClientWithToken = async (token: string): Promise<boolean> => {
    if (!token && !get(client) && !get(clientInitializing)) {
      set(clientError, t('subscription.error.init_error'));
      return false;
    }
    return connect(() => token);
  };

  /** For the account pages, which ask the backend for a token. */
  const initializeClient = async (): Promise<boolean> => connect(fetchClientToken);

  /**
   * Teardown Braintree client to clean up resources
   */
  const teardownClient = async (): Promise<void> => {
    try {
      const currentClient = get(client);
      if (currentClient) {
        await currentClient.teardown();
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

import type { ThreeDSecure, ThreeDSecureVerificationData, ThreeDSecureVerifyOptions } from 'braintree-web/three-d-secure';
import { get, set } from '@vueuse/core';
import { threeDSecure } from 'braintree-web';
import { type Client, create as createClient } from 'braintree-web/client';
import { create as createVaultManager } from 'braintree-web/vault-manager';
import { useLogger } from '~/utils/use-logger';

interface AuthenticationIframeEvent {
  element: HTMLIFrameElement;
}

interface BraintreeClientTokenResponse {
  braintreeClientToken: string;
}

interface UseCardThreeDSecureReturn {
  initialize: (cardToken: string, amount: number, braintreeToken: string, onChallengeRequired: () => void) => Promise<string>;
  verifyAndSetDefaultCard: (
    cardToken: string,
    amount: number,
    onChallengeRequired: () => void,
    onVerificationComplete?: () => void,
  ) => Promise<void>;
  teardown: () => void;
}

export function useCardThreeDSecure(): UseCardThreeDSecureReturn {
  const logger = useLogger('card-three-d-secure');
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { setDefaultCard } = usePaymentCards();

  const threeDSecureInstance = ref<ThreeDSecure>();
  const btClient = ref<Client>();

  async function createBraintreeClient(braintreeToken: string): Promise<Client> {
    logger.debug('Initializing Braintree client with token');
    const client = await createClient({
      authorization: braintreeToken,
    });
    set(btClient, client);
    logger.debug('Braintree client initialized');
    return client;
  }

  async function create3DSecureInstance(client: Client): Promise<ThreeDSecure> {
    const instance = await threeDSecure.create({
      client,
      version: '2-inline-iframe',
    });
    set(threeDSecureInstance, instance);
    logger.debug('3DS instance created, starting card verification');
    return instance;
  }

  function createEventHandlers(onChallengeRequired: () => void): {
    lookupHandler: (data?: ThreeDSecureVerificationData, next?: () => void) => void;
    iframeHandler: (event?: AuthenticationIframeEvent, next?: () => void) => void;
  } {
    const lookupHandler = (data?: ThreeDSecureVerificationData, next?: () => void): void => {
      logger.debug('3DS lookup complete', data);
      next?.();
    };

    const iframeHandler = (event?: AuthenticationIframeEvent, next?: () => void): void => {
      logger.debug('3DS iframe handler called', event);
      const iframe = event?.element;
      if (!iframe) {
        logger.error('3DS iframe element missing');
        return;
      }

      logger.debug('3DS iframe element found, styling and adding to container');

      // Style the iframe
      iframe.style.maxWidth = '100%';
      iframe.style.minHeight = '400px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';

      const container = document.getElementById('threeds-iframe-container');
      if (container) {
        logger.debug('3DS iframe container found, appending iframe');
        container.innerHTML = '';
        container.appendChild(iframe);
        onChallengeRequired();
        logger.info('3DS challenge active - iframe added to DOM');
      }
      else {
        logger.error('3DS iframe container not found in DOM');
      }

      next?.();
    };

    return { iframeHandler, lookupHandler };
  }

  async function fetchPaymentMethodBin(client: Client): Promise<string> {
    logger.debug('Creating VaultManager instance');
    const vmInstance = await createVaultManager({ client });

    try {
      const paymentMethods = await vmInstance.fetchPaymentMethods();
      logger.debug(`Fetched ${paymentMethods.length} payment methods from vault`);

      const paymentMethod = paymentMethods.find(({ type }) => type === 'CreditCard');
      logger.debug('Found payment method:', paymentMethod);

      if (!paymentMethod?.details || !('bin' in paymentMethod.details) || !paymentMethod.details.bin) {
        logger.error('BIN not found in payment method details');
        throw new Error('BIN not found in payment method details');
      }

      const bin = paymentMethod.details.bin;
      logger.debug('BIN extracted from payment method:', bin);

      return bin;
    }
    finally {
      await vmInstance.teardown();
    }
  }

  async function verifyCardWith3DS(
    instance: ThreeDSecure,
    cardToken: string,
    bin: string,
    amount: number,
  ): Promise<string> {
    logger.debug('Creating card nonce for token:', cardToken);
    const { createCardNonce } = usePaymentCards();
    const nonce = await createCardNonce({ paymentToken: cardToken });
    logger.debug('Card nonce created:', `${nonce.substring(0, 10)}...`);

    const options: ThreeDSecureVerifyOptions = {
      amount: amount.toFixed(2),
      bin,
      challengeRequested: true,
      nonce,
    };

    logger.debug('Starting 3DS verifyCard with options:', options);

    const {
      nonce: paymentMethodNonce,
      threeDSecureInfo: { liabilityShiftPossible, liabilityShifted },
    } = await instance.verifyCard(options);

    logger.debug('3DS liability shifted:', liabilityShifted);
    logger.debug('3DS liability shift possible:', liabilityShiftPossible);

    if (liabilityShiftPossible && !liabilityShifted) {
      throw new Error('3DS liability did not shift, please try again');
    }

    if (!paymentMethodNonce) {
      throw new Error('No nonce returned from 3DS verification');
    }

    return paymentMethodNonce;
  }

  async function initialize(
    cardToken: string,
    amount: number,
    braintreeToken: string,
    onChallengeRequired: () => void,
  ): Promise<string> {
    const client = await createBraintreeClient(braintreeToken);

    try {
      const instance = await create3DSecureInstance(client);
      const { lookupHandler, iframeHandler } = createEventHandlers(onChallengeRequired);

      try {
        instance.on('lookup-complete', lookupHandler);
        instance.on('authentication-iframe-available', iframeHandler);

        const bin = await fetchPaymentMethodBin(client);
        return await verifyCardWith3DS(instance, cardToken, bin, amount);
      }
      finally {
        instance.off('lookup-complete', lookupHandler);
        instance.off('authentication-iframe-available', iframeHandler);
      }
    }
    catch (error: unknown) {
      logger.error('3DS verification failed:', error);
      throw error;
    }
  }

  async function verifyAndSetDefaultCard(
    cardToken: string,
    amount: number,
    onChallengeRequired: () => void,
    onVerificationComplete?: () => void,
  ): Promise<void> {
    logger.debug('Starting complete 3DS verification and card setup flow');

    // Fetch Braintree client token
    const tokenResponse = await fetchWithCsrf<BraintreeClientTokenResponse>(
      '/webapi/2/braintree/customer',
      {
        method: 'GET',
      },
    );

    // Run 3DS verification
    const enrichedNonce = await initialize(
      cardToken,
      amount,
      tokenResponse.braintreeClientToken,
      onChallengeRequired,
    );

    // Notify that verification is complete, now setting card as default
    logger.debug('3DS verification complete, setting card as default');
    onVerificationComplete?.();

    // Set card as default using the enriched nonce
    await setDefaultCard(enrichedNonce);

    logger.debug('Successfully completed 3DS verification and set card as default');
  }

  function teardown(): void {
    const instance = get(threeDSecureInstance);
    if (instance) {
      try {
        instance.teardown();
        set(threeDSecureInstance, undefined);
        logger.debug('3DS instance torn down');
      }
      catch (error: unknown) {
        logger.error('Error tearing down 3DS instance:', error);
      }
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    teardown();
  });

  return {
    initialize,
    teardown,
    verifyAndSetDefaultCard,
  };
}

import type { Client } from 'braintree-web/client';
import type { ThreeDSecure, ThreeDSecureVerificationData, ThreeDSecureVerifyOptions } from 'braintree-web/three-d-secure';
import { CheckoutPaymentMethods, CheckoutSteps, parseBraintreeError, PaymentServerEvents, PaymentUserError } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { usePaymentCards } from '~/modules/checkout/composables/use-payment-cards';
import { usePaymentLogger } from '~/modules/checkout/composables/use-payment-logger';
import { useLogger } from '~/utils/use-logger';

interface AuthenticationIframeEvent {
  element: HTMLIFrameElement;
}

interface BraintreeClientTokenResponse {
  braintreeClientToken: string;
}

export interface CardVerificationRequest {
  cardToken: string;
  /**
   * Last four digits of the card being verified. The vault holds every card
   * the customer has saved, so this is what ties the BIN sent to 3DS to the
   * card the nonce was created from.
   */
  cardLast4: string;
  /** Card expiry as `MM/YY`, used to separate two vault entries sharing a last four. */
  cardExpiresAt: string;
  amount: number;
  onChallengeRequired: () => void;
  onVerificationComplete?: () => void;
}

interface UseCardThreeDSecureReturn {
  initialize: (request: Omit<CardVerificationRequest, 'onVerificationComplete'> & { braintreeToken: string }) => Promise<string>;
  verifyAndSetDefaultCard: (request: CardVerificationRequest) => Promise<void>;
  teardown: () => void;
}

/**
 * Compare a vault entry's expiry against a `SavedCard.expiresAt` (`MM/YY` or
 * `MM/YYYY`). Two-digit years are compared on their last two digits, which is
 * all a card prints.
 */
function expiryMatches(details: object, expiresAt: string): boolean {
  const parts = /^(\d{2})\/(\d{2,4})$/.exec(expiresAt);
  if (!parts)
    return false;

  // Narrowed with `in` rather than a cast: `details` is a union of every
  // payment-method shape braintree-web can return, and only the card ones
  // carry an expiry.
  if (!('expirationMonth' in details) || !('expirationYear' in details))
    return false;

  const [, month, year] = parts;
  const { expirationMonth: vaultMonth, expirationYear: vaultYear } = details;

  if (typeof vaultMonth !== 'string' || typeof vaultYear !== 'string')
    return false;

  return vaultMonth.padStart(2, '0') === month && vaultYear.slice(-2) === year!.slice(-2);
}

export function useCardThreeDSecure(): UseCardThreeDSecureReturn {
  const logger = useLogger('card-three-d-secure');
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { logPaymentEvent } = usePaymentLogger();
  const { setDefaultCard } = usePaymentCards();

  const threeDSecureInstance = shallowRef<ThreeDSecure>();
  const btClient = shallowRef<Client>();

  async function createBraintreeClient(braintreeToken: string): Promise<Client> {
    logger.debug('Initializing Braintree client with token');
    const { create: createClient } = await import('braintree-web/client');
    const client = await createClient({
      authorization: braintreeToken,
    });
    set(btClient, client);
    logger.debug('Braintree client initialized');
    return client;
  }

  async function create3DSecureInstance(client: Client): Promise<ThreeDSecure> {
    const threeDSecureModule = await import('braintree-web/three-d-secure');
    const instance = await threeDSecureModule.create({
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

      const container = typeof document === 'undefined' ? null : document.getElementById('threeds-iframe-container');
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

  /**
   * Find the BIN of the card being verified.
   *
   * Matching rather than taking the first credit card in the vault matters once
   * a customer has more than one saved: 3DS would otherwise look up a different
   * card's issuer than the one the nonce came from, and both the challenge and
   * the liability-shift decision would be made against the wrong card.
   *
   * The vault payload carries no vault token (`FetchPaymentMethodsPayload` is
   * nonce/type/details/description/binData), so `lastFour` is the coarsest key
   * available and expiry is what separates two cards that share it. If both
   * still match, it is the same card saved twice and the BIN is identical.
   */
  async function fetchPaymentMethodBin(client: Client, cardLast4: string, cardExpiresAt: string): Promise<string> {
    logger.debug('Creating VaultManager instance');
    const { create: createVaultManager } = await import('braintree-web/vault-manager');
    const vmInstance = await createVaultManager({ client });

    try {
      const paymentMethods = await vmInstance.fetchPaymentMethods();
      logger.debug(`Fetched ${paymentMethods.length} payment methods from vault`);

      const matches = paymentMethods.filter(({ type, details }) =>
        type === 'CreditCard' &&
        details &&
        'lastFour' in details &&
        details.lastFour === cardLast4,
      );

      const paymentMethod = matches.length > 1
        ? matches.find(({ details }) => details && expiryMatches(details, cardExpiresAt)) ?? matches[0]
        : matches[0];
      logger.debug('Found payment method:', paymentMethod);

      if (!paymentMethod?.details || !('bin' in paymentMethod.details) || !paymentMethod.details.bin) {
        logger.error(`BIN not found for card ending ${cardLast4}`);
        throw new PaymentUserError(
          'We could not find that card. Please refresh the page and try again.',
          { logDetail: `no vault entry for card ending ${cardLast4} among ${paymentMethods.length} methods` },
        );
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
      throw new PaymentUserError('3DS liability did not shift, please try again');
    }

    if (!paymentMethodNonce) {
      throw new Error('No nonce returned from 3DS verification');
    }

    return paymentMethodNonce;
  }

  async function initialize({ cardToken, cardLast4, cardExpiresAt, amount, braintreeToken, onChallengeRequired }:
  Omit<CardVerificationRequest, 'onVerificationComplete'> & { braintreeToken: string }): Promise<string> {
    const client = await createBraintreeClient(braintreeToken);

    try {
      const instance = await create3DSecureInstance(client);
      const { lookupHandler, iframeHandler } = createEventHandlers(onChallengeRequired);

      try {
        instance.on('lookup-complete', lookupHandler);
        instance.on('authentication-iframe-available', iframeHandler);

        const bin = await fetchPaymentMethodBin(client, cardLast4, cardExpiresAt);
        return await verifyCardWith3DS(instance, cardToken, bin, amount);
      }
      finally {
        instance.off('lookup-complete', lookupHandler);
        instance.off('authentication-iframe-available', iframeHandler);
      }
    }
    catch (error: unknown) {
      logger.error('3DS verification failed:', error);
      const { logMessage, code } = parseBraintreeError(error);
      logPaymentEvent({
        paymentMethod: CheckoutPaymentMethods.CARD,
        event: PaymentServerEvents.THREE_DS_VERIFICATION_FAILED,
        errorMessage: logMessage,
        errorCode: code,
        step: CheckoutSteps.VERIFY,
      });
      throw error;
    }
  }

  async function verifyAndSetDefaultCard({ cardToken, cardLast4, cardExpiresAt, amount, onChallengeRequired, onVerificationComplete }: CardVerificationRequest): Promise<void> {
    logger.debug('Starting complete 3DS verification and card setup flow');

    // Fetch Braintree client token
    const tokenResponse = await fetchWithCsrf<BraintreeClientTokenResponse>(
      '/webapi/2/braintree/customer',
      {
        method: 'GET',
      },
    );

    // Run 3DS verification
    const enrichedNonce = await initialize({
      cardToken,
      cardLast4,
      cardExpiresAt,
      amount,
      braintreeToken: tokenResponse.braintreeClientToken,
      onChallengeRequired,
    });

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

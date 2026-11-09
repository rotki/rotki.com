import type { ThreeDSecureParams, ThreeDSecureState } from '@rotki/card-payment-common/schemas/three-d-secure';
import type { Client } from 'braintree-web/client';
import type { ThreeDSecure, ThreeDSecureVerifyOptions } from 'braintree-web/three-d-secure';
import type { PayEvent } from '~/types/common';
import { clearThreeDSecureHandoff, readThreeDSecureHandoff } from '@rotki/card-payment-common/utils/three-d-secure-handoff';
import { CheckoutPaymentMethods, CheckoutSteps, parseBraintreeError, PaymentServerEvents, PaymentUserError, SigilEvents } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import { useAccountRefresh } from '~/composables/use-app-events';
import { type PurchaseDiscount, useCompletePurchase } from '~/modules/checkout/composables/use-complete-purchase';
import { usePaymentApi } from '~/modules/checkout/composables/use-payment-api';
import { usePaymentErrorMessage } from '~/modules/checkout/composables/use-payment-error-message';
import { usePaymentLogger } from '~/modules/checkout/composables/use-payment-logger';
import { isOutcomeUnknown, paymentFailureMessage } from '~/modules/checkout/utils/payment-failure';
import { mountChallengeFrame } from '~/modules/checkout/utils/three-d-secure-challenge';
import { useLogger } from '~/utils/use-logger';

/**
 * Why the payment stopped: the bank did not confirm it (nothing was charged), or the payment
 * itself failed before or after the confirmation (init error, a decline from the backend).
 */
export type ThreeDSecureFailure = 'not-confirmed' | 'payment';

interface UseThreeDSecureReturn {
  cleanup: () => void;
  clearStoredData: () => void;
  initializeProcess: () => Promise<{ success: boolean; params?: ThreeDSecureParams }>;
  challengeVisible: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string>>;
  failure: Readonly<Ref<ThreeDSecureFailure | undefined>>;
  isProcessing: ComputedRef<boolean>;
  serverError: Readonly<Ref<boolean>>;
  state: Readonly<Ref<ThreeDSecureState>>;
  params: Readonly<Ref<ThreeDSecureParams | undefined>>;
}

/**
 * Composable for managing 3D Secure verification flow
 */
export function useThreeDSecure(): UseThreeDSecureReturn {
  const logger = useLogger('three-d-secure');
  const { logPaymentEvent } = usePaymentLogger();
  const { userMessageFor } = usePaymentErrorMessage();
  const { chronicle } = useSigilEvents();
  const { completePurchase } = useCompletePurchase();
  const paymentApi = usePaymentApi();
  const { requestRefresh } = useAccountRefresh();

  const state = shallowRef<ThreeDSecureState>('initializing');
  const error = shallowRef<string>('');
  const failure = shallowRef<ThreeDSecureFailure>();
  const challengeVisible = shallowRef<boolean>(false);
  const serverError = shallowRef<boolean>(false);
  const btClient = shallowRef<Client>();
  const btThreeDSecure = shallowRef<ThreeDSecure>();
  const params = shallowRef<ThreeDSecureParams>();

  const isProcessing = computed<boolean>(() => {
    const currentState = get(state);
    return currentState === 'initializing' || currentState === 'verifying' || currentState === 'challenge-active' || currentState === 'finishing';
  });

  /** The payment the card page handed over, logging one that could not be read. */
  function getStoredParams(): ThreeDSecureParams | undefined {
    const handoff = readThreeDSecureHandoff();
    if (handoff.problem === 'invalid')
      logger.error('Invalid stored 3D Secure parameters:', handoff.cause);
    return handoff.params;
  }

  function clearStoredData(): void {
    clearThreeDSecureHandoff();
  }

  /**
   * Initialize Braintree clients for 3D Secure
   */
  async function initialize(params: ThreeDSecureParams): Promise<void> {
    try {
      set(state, 'initializing');
      set(error, '');

      const clientModule = await import('braintree-web/client');
      const threeDSecureModule = await import('braintree-web/three-d-secure');

      const newClient = await clientModule.create({
        authorization: params.token,
      });
      set(btClient, newClient);
      const newThreeDSecure = await threeDSecureModule.create({
        client: newClient,
        version: '2-inline-iframe',
      });
      set(btThreeDSecure, newThreeDSecure);

      set(state, 'ready');
      logger.info('3D Secure initialized successfully');
    }
    catch (initError: unknown) {
      const parsed = parseBraintreeError(initError);
      set(error, userMessageFor(parsed));
      set(state, 'error');
      logger.error(`Initialization failed: ${parsed.message}`, initError);
      logPaymentEvent({
        paymentMethod: CheckoutPaymentMethods.CARD,
        event: PaymentServerEvents.THREE_DS_VERIFICATION_FAILED,
        errorMessage: `Initialization failed: ${parsed.logMessage}`,
        errorCode: parsed.code,
        step: CheckoutSteps.INIT,
        planId: params.planId,
        isUpgrade: !!params.upgradeSubId,
      });
      throw initError;
    }
  }

  /**
   * Perform 3D Secure verification
   */
  async function verify(params: ThreeDSecureParams): Promise<PayEvent> {
    const threeDSecureInstance = get(btThreeDSecure);
    if (!threeDSecureInstance) {
      throw new Error('3D Secure not initialized');
    }

    set(state, 'verifying');
    set(error, '');
    // Set once a specific failure is logged, so the catch doesn't log it again as a generic event.
    let failureLogged = false;
    const lookupHandler = (_data: any, next: any) => {
      logger.debug('3D Secure lookup complete');
      next();
    };

    const iframeHandler = (event: any, next: any) => {
      const challengeFrame = event.element;
      if (!challengeFrame) {
        logger.error('3D Secure iframe element missing');
        return;
      }
      if (mountChallengeFrame(challengeFrame)) {
        set(challengeVisible, true);
        set(state, 'challenge-active');
        logger.info('3D Secure challenge active');
        chronicle(SigilEvents.CARD_3DS_CHALLENGE_SHOWN, {
          planId: params.planId,
          isUpgrade: !!params.upgradeSubId,
        });
      }
      else {
        logger.error('3D Secure iframe container not found');
      }

      next();
    };

    try {
      threeDSecureInstance.on('lookup-complete', lookupHandler);
      threeDSecureInstance.on('authentication-iframe-available', iframeHandler);

      const options: ThreeDSecureVerifyOptions = {
        amount: params.finalAmount,
        bin: params.bin,
        challengeRequested: true,
        nonce: params.nonce,
      };

      logger.info('Starting 3D Secure verification');

      const payload = await threeDSecureInstance.verifyCard(options);
      set(challengeVisible, false);

      const threeDSecureInfo = payload.threeDSecureInfo;

      if (threeDSecureInfo.liabilityShifted) {
        const payEvent: PayEvent = {
          discountCode: params.discountCode,
          paymentMethodNonce: payload.nonce,
          planId: params.planId,
          upgradeSubId: params.upgradeSubId,
        };

        logger.info('3D Secure verification successful');
        return payEvent;
      }
      else {
        const { status } = threeDSecureInfo;
        const errorMsg = `Authentication failed${status ? `: ${status.replaceAll('_', ' ')}` : ''}`;

        set(error, errorMsg);
        set(state, 'error');
        logger.error('3D Secure verification failed:', errorMsg);
        logPaymentEvent({
          paymentMethod: CheckoutPaymentMethods.CARD,
          event: PaymentServerEvents.THREE_DS_LIABILITY_SHIFT_FAILED,
          errorMessage: errorMsg,
          step: CheckoutSteps.VERIFY,
          planId: params.planId,
          isUpgrade: !!params.upgradeSubId,
          discountApplied: params.discountTrackingInfo !== undefined,
        });
        // Logged above as a liability-shift failure; the catch must not count it twice.
        failureLogged = true;
        throw new PaymentUserError(errorMsg);
      }
    }
    catch (verifyError: unknown) {
      set(challengeVisible, false);
      set(state, 'error');
      set(failure, 'not-confirmed');
      const parsed = parseBraintreeError(verifyError);

      set(error, userMessageFor(parsed));
      logger.error('3D Secure verification error:', verifyError);
      if (!failureLogged) {
        logPaymentEvent({
          paymentMethod: CheckoutPaymentMethods.CARD,
          event: PaymentServerEvents.THREE_DS_VERIFICATION_FAILED,
          errorMessage: parsed.logMessage,
          errorCode: parsed.code,
          step: CheckoutSteps.VERIFY,
          planId: params.planId,
          isUpgrade: !!params.upgradeSubId,
          discountApplied: params.discountTrackingInfo !== undefined,
        });
      }
      throw verifyError;
    }
    finally {
      threeDSecureInstance.off('lookup-complete', lookupHandler);
      threeDSecureInstance.off('authentication-iframe-available', iframeHandler);
    }
  }

  /**
   * Complete 3D Secure verification and finalize payment
   */
  async function verifyAndFinalizePayment(params: ThreeDSecureParams): Promise<void> {
    await initialize(params);

    const payEvent = await verify(params);
    set(state, 'finishing');

    const paymentPayload = {
      planId: payEvent.planId,
      paymentMethodNonce: payEvent.paymentMethodNonce,
      discountCode: payEvent.discountCode,
    };

    const result = payEvent.upgradeSubId
      ? await paymentApi.upgrade(paymentPayload, payEvent.upgradeSubId)
      : await paymentApi.pay(paymentPayload);

    if (!result.ok) {
      const message = paymentFailureMessage(result.error);
      if (isOutcomeUnknown(result.error)) {
        requestRefresh();
        set(serverError, true);
        // The full-screen overlay explains this one, so the message stays opaque.
        throw new Error(message);
      }
      throw new PaymentUserError(message);
    }

    // The card page passes what the discount was, since this page has no breakdown.
    const tracking = params.discountTrackingInfo;
    let discount: PurchaseDiscount | undefined;
    if (tracking)
      discount = tracking.isReferral ? 'referral' : 'discount';
    completePurchase({
      method: 'card',
      plan: { planId: params.planId, name: params.planName, durationInMonths: params.durationInMonths },
      paid: params.finalAmount,
      renewingPrice: params.renewingPrice,
      upgrade: !!params.upgradeSubId,
      discount,
    });
    requestRefresh();
    clearStoredData();
  }

  /**
   * Initialize the entire 3D Secure process
   * Gets stored parameters and runs the complete flow
   */
  async function initializeProcess(): Promise<{ success: boolean; params?: ThreeDSecureParams }> {
    const storedParams = getStoredParams();

    if (!storedParams) {
      set(state, 'error');
      return { success: false };
    }

    set(params, storedParams);

    try {
      // Complete the entire 3D Secure and payment flow
      await verifyAndFinalizePayment(storedParams);
      return { success: true, params: storedParams };
    }
    catch (processError: unknown) {
      logger.error('3D Secure process failed:', processError);
      set(state, 'error');
      if (!get(failure))
        set(failure, 'payment');
      // Init and verify failures already set their message; a failed charge has not yet.
      if (!get(error))
        set(error, userMessageFor(parseBraintreeError(processError)));
      return { success: false, params: storedParams };
    }
  }

  /**
   * Cleanup resources
   */
  function cleanup(): void {
    get(btThreeDSecure)
      ?.teardown()
      .catch((error: unknown) => logger.error('Error tearing down 3D Secure instance:', error));
    set(btClient, undefined);
    set(btThreeDSecure, undefined);
  }

  return {
    cleanup,
    clearStoredData,
    initializeProcess,
    challengeVisible: shallowReadonly(challengeVisible),
    error: shallowReadonly(error),
    failure: shallowReadonly(failure),
    isProcessing,
    params: shallowReadonly(params),
    serverError: shallowReadonly(serverError),
    state: shallowReadonly(state),
  };
}

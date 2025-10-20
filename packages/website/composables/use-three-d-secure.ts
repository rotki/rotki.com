import type { PayEvent } from '~/types/common';
import {
  type PaymentInfo,
  type ThreeDSecureParams,
  ThreeDSecureParamsSchema,
  type ThreeDSecureState,
} from '@rotki/card-payment-common/schemas/three-d-secure';
import { get, set } from '@vueuse/core';
import { type Client, create } from 'braintree-web/client';
import { create as createThreeDSecure, type ThreeDSecure, type ThreeDSecureVerifyOptions } from 'braintree-web/three-d-secure';
import { useAccountRefresh } from '~/composables/use-app-events';
import { usePaymentApi } from '~/composables/use-payment-api';
import { useLogger } from '~/utils/use-logger';

const SESSION_KEY = 'threeDSecureData';

interface UseThreeDSecureReturn {
  cleanup: () => void;
  clearStoredData: () => void;
  initializeProcess: () => Promise<{ success: boolean; params?: ThreeDSecureParams }>;
  challengeVisible: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string>>;
  isProcessing: ComputedRef<boolean>;
  state: Readonly<Ref<ThreeDSecureState>>;
  paymentInfo: Readonly<Ref<PaymentInfo | undefined>>;
}

/**
 * Composable for managing 3D Secure verification flow
 */
export function useThreeDSecure(): UseThreeDSecureReturn {
  const logger = useLogger('three-d-secure');

  const state = ref<ThreeDSecureState>('initializing');
  const error = ref<string>('');
  const challengeVisible = ref<boolean>(false);
  const btClient = ref<Client>();
  const btThreeDSecure = ref<ThreeDSecure>();
  const paymentInfo = ref<PaymentInfo>();

  const isProcessing = computed<boolean>(() => {
    const currentState = get(state);
    return currentState === 'initializing' || currentState === 'verifying' || currentState === 'challenge-active';
  });

  /**
   * Retrieve 3D Secure parameters from session storage
   */
  function getStoredParams(): ThreeDSecureParams | undefined {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) {
        return undefined;
      }

      const parsed = JSON.parse(stored);
      const result = ThreeDSecureParamsSchema.safeParse(parsed);
      if (!result.success) {
        logger.error('Invalid stored 3D Secure parameters:', result.error);
        sessionStorage.removeItem(SESSION_KEY);
        return undefined;
      }
      return result.data;
    }
    catch (parseError) {
      logger.error('Failed to parse stored 3D Secure parameters:', parseError);
      sessionStorage.removeItem(SESSION_KEY);
      return undefined;
    }
  }

  /**
   * Clear stored 3D Secure data
   */
  function clearStoredData(): void {
    sessionStorage.removeItem(SESSION_KEY);
  }

  /**
   * Initialize Braintree clients for 3D Secure
   */
  async function initialize(params: ThreeDSecureParams): Promise<void> {
    try {
      set(state, 'initializing');
      set(error, '');

      const newClient = await create({
        authorization: params.token,
      });
      set(btClient, newClient);
      const newThreeDSecure = await createThreeDSecure({
        client: newClient,
        version: '2-inline-iframe',
      });
      set(btThreeDSecure, newThreeDSecure);

      set(state, 'ready');
      logger.info('3D Secure initialized successfully');
    }
    catch (initError: any) {
      const errorMsg = `Initialization failed: ${initError.message}`;
      set(error, errorMsg);
      set(state, 'error');
      logger.error(errorMsg, initError);
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
    const lookupHandler = (_data: any, next: any) => {
      logger.debug('3D Secure lookup complete');
      next();
    };

    const iframeHandler = (event: any, next: any) => {
      const iframe = event.element;
      if (!iframe) {
        logger.error('3D Secure iframe element missing');
        return;
      }
      // Use standard 3D Secure 2.0 window size (500x600)
      // with responsive width for mobile
      iframe.style.maxWidth = '100%';
      iframe.style.minHeight = '400px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      const container = document.getElementById('threeds-iframe-container');
      if (container) {
        container.innerHTML = '';
        container.appendChild(iframe);
        set(challengeVisible, true);
        set(state, 'challenge-active');
        logger.info('3D Secure challenge active');
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
        amount: params.amount,
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
        const status = (threeDSecureInfo as any)?.status as string | undefined;
        const errorMsg = `Authentication failed${status ? `: ${status.replaceAll('_', ' ')}` : ''}`;

        set(error, errorMsg);
        set(state, 'error');
        logger.error('3D Secure verification failed:', errorMsg);
        throw new Error(errorMsg);
      }
    }
    catch (verifyError: any) {
      set(challengeVisible, false);
      set(state, 'error');
      const errorMsg = verifyError.message || 'Verification failed';

      set(error, errorMsg);
      logger.error('3D Secure verification error:', verifyError);
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
    // These composables need to be inside the function since they can only be used at component level
    const paymentApi = usePaymentApi();
    const { requestRefresh } = useAccountRefresh();

    // Initialize Braintree
    await initialize(params);

    // Start verification
    const payEvent = await verify(params);

    // Finalize payment with API call
    const result = await paymentApi.pay({
      planId: payEvent.planId,
      paymentMethodNonce: payEvent.paymentMethodNonce,
      discountCode: payEvent.discountCode,
      upgradeSubId: payEvent.upgradeSubId,
    });

    if (result.isError) {
      throw new Error(result.error.message);
    }

    // Request account refresh and prepare for success navigation
    requestRefresh();
    sessionStorage.setItem('payment-completed', 'true');
    clearStoredData();
  }

  /**
   * Initialize the entire 3D Secure process
   * Gets stored parameters and runs the complete flow
   */
  async function initializeProcess(): Promise<{ success: boolean; params?: ThreeDSecureParams }> {
    // Get stored parameters
    const storedParams = getStoredParams();

    if (!storedParams) {
      // No valid parameters found
      return { success: false };
    }

    logger.info('storedParams', storedParams);
    set(paymentInfo, {
      durationInMonths: storedParams.durationInMonths.toString(),
      amount: storedParams.amount,
      finalAmount: storedParams.finalAmount,
    });

    try {
      // Complete the entire 3D Secure and payment flow
      await verifyAndFinalizePayment(storedParams);
      return { success: true, params: storedParams };
    }
    catch (initError) {
      // Error is handled by the composable state
      console.error('3D Secure process failed:', initError);
      return { success: false, params: storedParams };
    }
  }

  /**
   * Cleanup resources
   */
  function cleanup(): void {
    get(btThreeDSecure)?.teardown();
    set(btClient, undefined);
    set(btThreeDSecure, undefined);
  }

  return {
    cleanup,
    clearStoredData,
    initializeProcess,
    challengeVisible: readonly(challengeVisible),
    error: readonly(error),
    isProcessing,
    state: readonly(state),
    paymentInfo: readonly(paymentInfo),
  };
}

import type { PayEvent } from '~/types/common';
import { get, set } from '@vueuse/core';
import { type Client, create } from 'braintree-web/client';
import { create as createThreeDSecure, type ThreeDSecure, type ThreeDSecureVerifyOptions } from 'braintree-web/three-d-secure';
import {
  type ThreeDSecureParams,
  ThreeDSecureParamsSchema,
  type ThreeDSecureResult,
  ThreeDSecureResultSchema,
  type ThreeDSecureState,

} from '~/types/three-d-secure';
import { navigateToWithCSPSupport } from '~/utils/navigation';
import { useLogger } from '~/utils/use-logger';

const SESSION_KEY = 'threeDSecureData';
const RESULT_KEY = 'threeDSecureResult';

/**
 * Composable for managing 3D Secure verification flow
 */
export function useThreeDSecure() {
  const logger = useLogger('three-d-secure');

  const state = ref<ThreeDSecureState>('initializing');
  const error = ref<string>('');
  const challengeVisible = ref<boolean>(false);
  const btClient = ref<Client>();
  const btThreeDSecure = ref<ThreeDSecure>();

  const isProcessing = computed<boolean>(() => {
    const currentState = get(state);
    return currentState === 'initializing' || currentState === 'verifying' || currentState === 'challenge-active';
  });

  const canRetry = computed<boolean>(() => {
    const currentState = get(state);
    return currentState === 'error' || currentState === 'ready';
  });

  /**
   * Store 3D Secure parameters in session storage
   */
  function storeParams(params: ThreeDSecureParams): void {
    const result = ThreeDSecureParamsSchema.safeParse(params);
    if (!result.success) {
      logger.error('Invalid 3D Secure parameters:', result.error);
      throw new Error('Invalid parameters provided');
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.data));
    logger.debug('3D Secure parameters stored');
  }

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
   * Store 3D Secure result in session storage
   */
  function storeResult(result: ThreeDSecureResult): void {
    const validation = ThreeDSecureResultSchema.safeParse(result);
    if (!validation.success) {
      logger.error('Invalid 3D Secure result:', validation.error);
      return;
    }
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(validation.data));
  }

  /**
   * Retrieve and consume 3D Secure result from session storage
   */
  function getAndConsumeResult(): ThreeDSecureResult | undefined {
    try {
      const stored = sessionStorage.getItem(RESULT_KEY);
      if (!stored) {
        return undefined;
      }

      sessionStorage.removeItem(RESULT_KEY);

      const parsed = JSON.parse(stored);
      const result = ThreeDSecureResultSchema.safeParse(parsed);
      if (!result.success) {
        logger.error('Invalid stored 3D Secure result:', result.error);
        return undefined;
      }
      return result.data;
    }
    catch (parseError) {
      logger.error('Failed to parse stored 3D Secure result:', parseError);
      return undefined;
    }
  }

  /**
   * Clear stored 3D Secure data
   */
  function clearStoredData(): void {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(RESULT_KEY);
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
      iframe.style.width = '100%';
      iframe.style.maxWidth = '500px';
      iframe.style.height = '600px';
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
          months: params.planMonths,
          nonce: payload.nonce,
        };
        storeResult({
          nonce: payload.nonce,
          planMonths: params.planMonths,
          success: true,
        });

        logger.info('3D Secure verification successful');
        return payEvent;
      }
      else {
        const status = (threeDSecureInfo as any)?.status as string | undefined;
        const errorMsg = `Authentication failed${status ? `: ${status.replaceAll('_', ' ')}` : ''}`;
        storeResult({
          error: errorMsg,
          planMonths: params.planMonths,
          success: false,
        });

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
      if (!get(error)) {
        storeResult({
          error: errorMsg,
          planMonths: params.planMonths,
          success: false,
        });
      }

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
   * Navigate to 3D Secure verification page
   */
  async function navigateToVerification(params: ThreeDSecureParams): Promise<void> {
    try {
      storeParams(params);
      await navigateToWithCSPSupport('/checkout/pay/3d-secure');
    }
    catch (navError) {
      logger.error('Failed to navigate to 3D Secure page:', navError);
      throw navError;
    }
  }

  /**
   * Navigate back to payment page with plan persistence
   */
  async function navigateToPayment(planMonths: number, paymentMethodId?: string): Promise<void> {
    await navigateTo({
      name: 'checkout-pay-card',
      query: {
        plan: planMonths.toString(),
        ...(paymentMethodId && { method: paymentMethodId }),
      },
    });
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
    canRetry: readonly(canRetry),
    challengeVisible: readonly(challengeVisible),
    cleanup,
    clearStoredData,
    error: readonly(error),
    getAndConsumeResult,
    getStoredParams,
    initialize,
    isProcessing: readonly(isProcessing),
    navigateToPayment,
    navigateToVerification,
    state: readonly(state),
    verify,
  };
}

import type { CardPaymentRequest } from '@rotki/card-payment-common/schemas/payment';
import type { PayPalCheckout } from 'braintree-web';
import type { DeepReadonly, Ref } from 'vue';
import { ActionResultResponseSchema } from '@rotki/card-payment-common/schemas/api';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { CheckoutPaymentMethods, CheckoutSteps, parseBraintreeError, PaymentServerEvents } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';
import { FetchError } from 'ofetch';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useBraintreeClient } from '~/modules/checkout/composables/use-braintree-client';
import { usePaymentErrorMessage } from '~/modules/checkout/composables/use-payment-error-message';
import { usePaymentLogger } from '~/modules/checkout/composables/use-payment-logger';
import { usePaypalApi } from '~/modules/checkout/composables/use-paypal-api';
import { assert } from '~/utils/assert';
import { nonEmpty } from '~/utils/non-empty';
import { useLogger } from '~/utils/use-logger';

export interface PaypalPaymentParams {
  planId: number;
  discountCode?: string;
  upgradeSubId?: string;
}

export interface PaypalSubmitResult {
  success: boolean;
  error?: string;
  blocked?: boolean;
}

interface PaypalButtonActions {
  enable: () => void;
  disable: () => void;
}

/**
 * The PayPal SDK types the `onInit` `actions` argument as a bare `object`, so this
 * guard narrows it to the enable/disable shape instead of asserting.
 */
function isPaypalButtonActions(value: object): value is PaypalButtonActions {
  return 'enable' in value && typeof value.enable === 'function'
    && 'disable' in value && typeof value.disable === 'function';
}

/** Request payload for a PayPal payment, omitting the empty optional fields. */
function buildPaymentPayload(nonce: string, params: PaypalPaymentParams): CardPaymentRequest {
  const payload: CardPaymentRequest = {
    planId: params.planId,
    paymentMethodNonce: nonce,
  };

  if (params.discountCode) {
    payload.discountCode = params.discountCode;
  }

  if (params.upgradeSubId) {
    payload.upgradeSubId = params.upgradeSubId;
  }

  return payload;
}

interface PaypalButtonCallbacks {
  onPaymentStart: () => void;
  onPaymentSuccess: (nonce: string) => void;
  onPaymentError: (error: string) => void;
  onPaymentCancel: () => void;
}

interface RenderButtonOptions {
  callbacks: PaypalButtonCallbacks;
  accepted: Ref<boolean>;
  loading: Ref<boolean>;
}

export interface PaypalTrackingContext {
  planId?: number;
  isUpgrade: boolean;
}

interface UsePaypalPaymentFlowOptions {
  /** Supplies analytics tracking context captured at payment time. */
  getTrackingContext?: () => PaypalTrackingContext;
}

interface UsePaypalPaymentFlowReturn {
  // State
  paying: DeepReadonly<Ref<boolean>>;
  initialized: DeepReadonly<Ref<boolean>>;

  // Actions
  initializeSdk: (token: string, amount: number) => Promise<{ success: boolean; error?: string }>;
  renderButton: (options: RenderButtonOptions) => Promise<void>;
  updateAmount: (amount: number) => void;
  submitPayment: (nonce: string, params: PaypalPaymentParams) => Promise<PaypalSubmitResult>;
  reset: () => void;
}

/**
 * Pure PayPal payment flow - handles only PayPal SDK and API calls.
 * Orchestration (loading plans, error handling, navigation) happens outside.
 */
export function usePaypalPaymentFlow(options: UsePaypalPaymentFlowOptions = {}): UsePaypalPaymentFlowReturn {
  const { addPaypalAccount, createPaypalNonce } = usePaypalApi();
  const { client, initializeClientWithToken } = useBraintreeClient();
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { requestRefresh } = useAccountRefresh();
  const logger = useLogger('paypal-payment-flow');
  const { logPaymentEvent } = usePaymentLogger();
  const { userMessageFor } = usePaymentErrorMessage();

  function getContext(): PaypalTrackingContext {
    return options.getTrackingContext?.() ?? { isUpgrade: false };
  }

  const paying = shallowRef<boolean>(false);
  const initialized = shallowRef<boolean>(false);
  const currentAmount = shallowRef<number>(0);
  const paypalActions = ref<PaypalButtonActions>();

  let btPayPalCheckoutInstance: PayPalCheckout | undefined;

  function reset(): void {
    set(paying, false);
    set(initialized, false);
    set(currentAmount, 0);
    set(paypalActions, undefined);
    btPayPalCheckoutInstance = undefined;
  }

  function updateAmount(amount: number): void {
    set(currentAmount, amount);
  }

  async function initializeSdk(token: string, amount: number): Promise<{ success: boolean; error?: string }> {
    try {
      const clientSuccess = await initializeClientWithToken(token);
      if (!clientSuccess) {
        return { success: false, error: 'Failed to initialize Braintree client' };
      }

      set(currentAmount, amount);

      const btClient = get(client);
      assert(btClient, 'Braintree client not initialized');

      const paypalCheckout = await import('braintree-web/paypal-checkout');
      btPayPalCheckoutInstance = await paypalCheckout.create({ client: btClient });

      await btPayPalCheckoutInstance.loadPayPalSDK({
        currency: 'EUR',
        vault: true,
        commit: true,
        intent: 'tokenize',
        components: 'buttons',
      });

      set(initialized, true);
      return { success: true };
    }
    catch (error: unknown) {
      logger.error('Failed to initialize PayPal SDK:', error);
      const ctx = getContext();
      const parsed = parseBraintreeError(error);
      logPaymentEvent({
        paymentMethod: CheckoutPaymentMethods.PAYPAL,
        event: PaymentServerEvents.PAYPAL_SDK_INIT_FAILED,
        errorMessage: parsed.logMessage,
        errorCode: parsed.code,
        step: CheckoutSteps.INIT,
        planId: ctx.planId,
        isUpgrade: ctx.isUpgrade,
      });
      return { success: false, error: userMessageFor(parsed) };
    }
  }

  async function renderButton({ callbacks, accepted, loading }: RenderButtonOptions): Promise<void> {
    assert(btPayPalCheckoutInstance, 'PayPal checkout instance not initialized');

    const paypal = typeof window === 'undefined' ? undefined : window.paypal;
    assert(paypal, 'PayPal SDK not loaded');

    const buttonContainer = typeof document === 'undefined' ? null : document.getElementById('paypal-button');
    if (buttonContainer) {
      buttonContainer.innerHTML = '';
    }

    paypal.Buttons({
      createBillingAgreement: async () => {
        set(paying, true);
        callbacks.onPaymentStart();
        return btPayPalCheckoutInstance!.createPayment({
          flow: 'vault',
          amount: get(currentAmount),
          currency: 'EUR',
        });
      },
      onApprove: async (data): Promise<any> => {
        set(paying, true);
        try {
          const tokenResponse = await btPayPalCheckoutInstance!.tokenizePayment(data);
          const vaultedToken = await addPaypalAccount({ paymentMethodNonce: tokenResponse.nonce });
          const vaultedNonce = await createPaypalNonce({ paymentToken: vaultedToken });
          callbacks.onPaymentSuccess(vaultedNonce);
          return { nonce: vaultedNonce, tokenResponse };
        }
        catch (error: unknown) {
          const parsed = parseBraintreeError(error);
          callbacks.onPaymentError(userMessageFor(parsed));
          const ctx = getContext();
          logPaymentEvent({
            paymentMethod: CheckoutPaymentMethods.PAYPAL,
            event: PaymentServerEvents.PAYPAL_PAYMENT_ERROR,
            errorMessage: parsed.logMessage,
            errorCode: parsed.code,
            step: CheckoutSteps.CALLBACK,
            planId: ctx.planId,
            isUpgrade: ctx.isUpgrade,
          });
          set(paying, false);
          return undefined;
        }
      },
      onError: (error: any) => {
        set(paying, false);
        const ctx = getContext();
        logPaymentEvent({
          paymentMethod: CheckoutPaymentMethods.PAYPAL,
          event: PaymentServerEvents.PAYPAL_PAYMENT_ERROR,
          errorMessage: error?.message ?? 'Payment failed',
          step: CheckoutSteps.CALLBACK,
          planId: ctx.planId,
          isUpgrade: ctx.isUpgrade,
        });
        callbacks.onPaymentError(error?.message ?? 'Payment failed');
      },
      onCancel: () => {
        set(paying, false);
        callbacks.onPaymentCancel();
      },
      onInit: (_, actions) => {
        if (!isPaypalButtonActions(actions))
          return;

        set(paypalActions, actions);
        actions.disable();
      },
    }).render('#paypal-button');

    /** Enables the PayPal button only once the policy is accepted and nothing is in flight. */
    const checkEnabled = (): void => {
      const actions = get(paypalActions);
      if (get(accepted) && !get(paying) && !get(loading)) {
        actions?.enable();
      }
      else {
        actions?.disable();
      }
    };

    checkEnabled();

    watch([paying, paypalActions, accepted, loading], checkEnabled);
  }

  /**
   * Maps a failed submission to the message to report. A 400 uses the backend's
   * message, a 403 a generic one, and any other HTTP failure refreshes the account
   * and flags checkout as blocked.
   */
  function resolveSubmitError(error: any): { errorMessage: string; blocked: boolean } {
    let errorMessage = nonEmpty(error.message) ?? 'Payment failed';
    let blocked = false;

    if (error instanceof FetchError) {
      if (error.status === 400) {
        const parsed = ActionResultResponseSchema.safeParse(error.data);
        if (parsed.success) {
          errorMessage = parsed.data.message;
        }
      }
      else if (error.status === 403) {
        errorMessage = 'Payment failed';
      }
      else {
        requestRefresh();
        blocked = true;
      }
    }

    return { errorMessage, blocked };
  }

  async function submitPayment(nonce: string, params: PaypalPaymentParams): Promise<PaypalSubmitResult> {
    const { planId, upgradeSubId } = params;

    set(paying, true);

    try {
      const payload = buildPaymentPayload(nonce, params);

      const endpoint = upgradeSubId
        ? '/webapi/2/braintree/upgrade'
        : '/webapi/2/braintree/payments';

      const body = upgradeSubId
        ? convertKeys({ ...payload, subscriptionId: upgradeSubId }, false, false)
        : convertKeys(payload, false, false);

      await fetchWithCsrf(endpoint, {
        method: 'POST',
        body,
      });

      requestRefresh();
      return { success: true };
    }
    catch (error_: any) {
      const { errorMessage, blocked } = resolveSubmitError(error_);

      logger.error('Payment submission failed:', error_);
      logPaymentEvent({
        paymentMethod: CheckoutPaymentMethods.PAYPAL,
        event: PaymentServerEvents.PAYPAL_SUBMIT_ERROR,
        errorMessage,
        errorCode: String(error_?.status ?? ''),
        step: CheckoutSteps.SUBMIT,
        planId,
        isUpgrade: !!upgradeSubId,
      });
      return { success: false, error: errorMessage, blocked };
    }
    finally {
      set(paying, false);
    }
  }

  return {
    paying: readonly(paying),
    initialized: readonly(initialized),
    initializeSdk,
    renderButton,
    updateAmount,
    submitPayment,
    reset,
  };
}

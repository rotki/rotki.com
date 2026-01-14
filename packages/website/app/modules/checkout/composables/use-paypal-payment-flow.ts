import type { CardPaymentRequest } from '@rotki/card-payment-common/schemas/payment';
import type { PayPalCheckout } from 'braintree-web';
import type { DeepReadonly, Ref } from 'vue';
import { ActionResultResponseSchema } from '@rotki/card-payment-common/schemas/api';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { get, set } from '@vueuse/shared';
import { FetchError } from 'ofetch';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useBraintreeClient } from '~/modules/checkout/composables/use-braintree-client';
import { usePaypalApi } from '~/modules/checkout/composables/use-paypal-api';
import { assert } from '~/utils/assert';
import { useLogger } from '~/utils/use-logger';

export interface PaypalPaymentParams {
  planId: number;
  discountCode?: string;
  upgradeSubId?: string;
}

export interface PaypalSubmitResult {
  success: boolean;
  error?: string;
}

interface PaypalButtonActions {
  enable: () => void;
  disable: () => void;
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
export function usePaypalPaymentFlow(): UsePaypalPaymentFlowReturn {
  const { addPaypalAccount, createPaypalNonce } = usePaypalApi();
  const { client, initializeClientWithToken } = useBraintreeClient();
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { requestRefresh } = useAccountRefresh();
  const logger = useLogger('paypal-payment-flow');

  const paying = ref<boolean>(false);
  const initialized = ref<boolean>(false);
  const currentAmount = ref<number>(0);
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
    catch (error: any) {
      logger.error('Failed to initialize PayPal SDK:', error);
      return { success: false, error: error.message };
    }
  }

  async function renderButton({ callbacks, accepted, loading }: RenderButtonOptions): Promise<void> {
    assert(btPayPalCheckoutInstance, 'PayPal checkout instance not initialized');

    const paypal = window.paypal;
    assert(paypal, 'PayPal SDK not loaded');

    const buttonContainer = document.getElementById('paypal-button');
    if (buttonContainer) {
      buttonContainer.innerHTML = '';
    }

    paypal.Buttons({
      createBillingAgreement: async () => {
        set(paying, true);
        callbacks.onPaymentStart();
        return btPayPalCheckoutInstance!.createPayment({
          flow: 'vault' as any,
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
        catch (error: any) {
          callbacks.onPaymentError(error?.message ?? String(error));
          set(paying, false);
          return undefined;
        }
      },
      onError: (error: any) => {
        set(paying, false);
        callbacks.onPaymentError(error?.message ?? 'Payment failed');
      },
      onCancel: () => {
        set(paying, false);
        callbacks.onPaymentCancel();
      },
      onInit: (_, actions) => {
        set(paypalActions, actions as PaypalButtonActions);
        (actions as PaypalButtonActions).disable();
      },
    }).render('#paypal-button');

    // Set up button enable/disable based on external condition
    const checkEnabled = (): void => {
      const actions = get(paypalActions);
      if (get(accepted) && !get(paying) && !get(loading)) {
        actions?.enable();
      }
      else {
        actions?.disable();
      }
    };

    // Initial check
    checkEnabled();

    // Watch for changes in all relevant state
    watch([paying, paypalActions, accepted, loading], checkEnabled);
  }

  async function submitPayment(nonce: string, params: PaypalPaymentParams): Promise<PaypalSubmitResult> {
    const { planId, discountCode, upgradeSubId } = params;

    set(paying, true);

    try {
      const payload: CardPaymentRequest = {
        planId,
        paymentMethodNonce: nonce,
      };

      if (discountCode) {
        payload.discountCode = discountCode;
      }

      if (upgradeSubId) {
        payload.upgradeSubId = upgradeSubId;
      }

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
      let errorMessage = error_.message || 'Payment failed';

      if (error_ instanceof FetchError) {
        if (error_.status === 400) {
          const parsed = ActionResultResponseSchema.safeParse(error_.data);
          if (parsed.success) {
            errorMessage = parsed.data.message;
          }
        }
        else if (error_.status === 403) {
          errorMessage = 'Payment failed';
        }
      }

      logger.error('Payment submission failed:', error_);
      return { success: false, error: errorMessage };
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

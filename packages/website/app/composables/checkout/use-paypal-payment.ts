import type { CardPaymentRequest } from '@rotki/card-payment-common/schemas/payment';
import type { Ref } from 'vue';
import { ActionResultResponseSchema } from '@rotki/card-payment-common/schemas/api';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { get, set } from '@vueuse/shared';
import { FetchError } from 'ofetch';
import { useBraintreeClient } from '~/composables/checkout/use-braintree-client';
import { useCheckout } from '~/composables/checkout/use-checkout';
import { usePaypalApi } from '~/composables/checkout/use-paypal-api';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { assert } from '~/utils/assert';
import { useLogger } from '~/utils/use-logger';

interface UsePaypalPaymentReturn {
  initPaypal: (options: { accepted: Ref<boolean> }) => Promise<void>;
  submitPayment: (nonce: string) => Promise<void>;
  paypalInitialized: Readonly<Ref<boolean>>;
  paying: Readonly<Ref<boolean>>;
  initializeClient: () => Promise<boolean>;
  clientInitializing: Readonly<Ref<boolean>>;
}

/**
 * PayPal payment composable for checkout flow
 * Handles PayPal button initialization and payment submission
 */
export function usePaypalPayment(): UsePaypalPaymentReturn {
  const checkout = useCheckout();
  const { addPaypalAccount, createPaypalNonce } = usePaypalApi();
  const { client, clientInitializing, initializeClientWithToken } = useBraintreeClient();
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { requestRefresh } = useAccountRefresh();
  const { t } = useI18n({ useScope: 'global' });
  const logger = useLogger('paypal-payment');

  const paypalInitialized = ref<boolean>(false);
  const paypalActions = ref<any>();
  const paying = ref<boolean>(false);

  /**
   * Initialize Braintree client with token from checkout
   */
  async function initializeClient(): Promise<boolean> {
    const token = get(checkout.braintreeToken);
    if (!token) {
      logger.warn('No Braintree token available');
      return false;
    }
    return initializeClientWithToken(token);
  }

  /**
   * Initialize PayPal button
   */
  async function initPaypal(options: { accepted: Ref<boolean> }): Promise<void> {
    const btClient = get(client);
    const plan = get(checkout.effectiveSelectedPlan);
    const breakdownData = get(checkout.breakdown);

    if (!btClient || !plan) {
      logger.warn('Missing required data for PayPal initialization');
      return;
    }

    if (get(paypalInitialized)) {
      return;
    }

    const grandTotal = breakdownData ? parseFloat(breakdownData.finalAmount) : plan.price;

    const paypalCheckout = await import('braintree-web/paypal-checkout');
    const btPayPalCheckout = await paypalCheckout.create({
      client: btClient,
    });

    await btPayPalCheckout.loadPayPalSDK({
      currency: 'EUR',
      vault: true,
      commit: true,
      intent: 'tokenize',
      components: 'buttons',
    });

    const paypal = window.paypal;
    assert(paypal, 'PayPal SDK not loaded');

    paypal.Buttons({
      createBillingAgreement: async () => {
        set(paying, true);
        checkout.setStep('pending');
        logger.debug(`Creating payment for ${grandTotal} EUR`);
        return btPayPalCheckout.createPayment({
          flow: 'vault' as any,
          amount: grandTotal,
          currency: 'EUR',
        });
      },
      onApprove: async (data): Promise<any> => {
        set(paying, true);
        logger.debug('User approved PayPal payment');
        try {
          const tokenResponse = await btPayPalCheckout.tokenizePayment(data);
          const vaultedToken = await addPaypalAccount({ paymentMethodNonce: tokenResponse.nonce });
          const vaultedNonce = await createPaypalNonce({ paymentToken: vaultedToken });
          await submitPayment(vaultedNonce);
          return tokenResponse;
        }
        catch (error: any) {
          logger.error('PayPal payment failed:', error);
          checkout.setError(t('subscription.error.payment_failure'), error?.message ?? String(error));
          set(paying, false);
          return undefined;
        }
      },
      onError: (error: any) => {
        set(paying, false);
        checkout.setStep('idle');
        logger.error('PayPal payment failed with error', error);
        checkout.setError(t('subscription.error.payment_failure'), error?.message ?? 'Payment failed');
      },
      onCancel: () => {
        set(paying, false);
        checkout.setStep('idle');
        logger.info('PayPal payment was cancelled by user');
      },
      onInit: (_, actions) => {
        set(paypalActions, actions);
        (actions as { disable: () => void }).disable();
      },
    }).render('#paypal-button');

    set(paypalInitialized, true);

    // Watch accepted state to enable/disable PayPal button
    watch(options.accepted, (isAccepted) => {
      const actions = get(paypalActions);
      if (actions) {
        if (isAccepted) {
          actions.enable();
        }
        else {
          actions.disable();
        }
      }
    }, { immediate: true });

    // Watch paying state to disable button during processing
    watch(paying, (isPaying) => {
      const actions = get(paypalActions);
      if (actions) {
        if (isPaying) {
          actions.disable();
        }
        else if (get(options.accepted)) {
          actions.enable();
        }
      }
    });
  }

  /**
   * Submit PayPal payment to backend
   */
  async function submitPayment(nonce: string): Promise<void> {
    const plan = get(checkout.effectiveSelectedPlan);
    const discountCode = get(checkout.appliedDiscountCode);
    const upgradeSubId = get(checkout.upgradeSubId);

    if (!plan) {
      checkout.setError(t('subscription.error.payment_failure'), 'No plan selected');
      return;
    }

    checkout.setLoading(true);
    checkout.setStep('pending');

    try {
      const payload: CardPaymentRequest = {
        planId: plan.planId,
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
      checkout.setStep('success');
      sessionStorage.setItem('payment-completed', 'true');
      await navigateTo('/checkout/success');
    }
    catch (error_: any) {
      let errorMessage = error_.message || t('subscription.error.payment_failure');

      if (error_ instanceof FetchError) {
        if (error_.status === 400) {
          const parsed = ActionResultResponseSchema.safeParse(error_.data);
          if (parsed.success) {
            errorMessage = parsed.data.message;
          }
        }
        else if (error_.status === 403) {
          errorMessage = t('subscription.error.payment_failure');
        }
      }

      logger.error('Payment submission failed:', error_);
      checkout.setError(t('subscription.error.payment_failure'), errorMessage);
    }
    finally {
      checkout.setLoading(false);
      set(paying, false);
    }
  }

  return {
    clientInitializing,
    initializeClient,
    initPaypal,
    paypalInitialized: readonly(paypalInitialized),
    paying: readonly(paying),
    submitPayment,
  };
}

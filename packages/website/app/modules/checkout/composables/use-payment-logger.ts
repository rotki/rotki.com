export const PaymentMethods = {
  CARD: 'card',
  PAYPAL: 'paypal',
  CRYPTO: 'crypto',
} as const;

export type PaymentMethod = (typeof PaymentMethods)[keyof typeof PaymentMethods];

export const PaymentEvents = {
  BRAINTREE_INIT_FAILED: 'braintree_init_failed',
  THREE_DS_VERIFICATION_FAILED: '3ds_verification_failed',
  THREE_DS_LIABILITY_SHIFT_FAILED: '3ds_liability_shift_failed',
  CARD_PAYMENT_API_ERROR: 'card_payment_api_error',
  PAYPAL_SDK_INIT_FAILED: 'paypal_sdk_init_failed',
  PAYPAL_PAYMENT_ERROR: 'paypal_payment_error',
  PAYPAL_SUBMIT_ERROR: 'paypal_submit_error',
  CRYPTO_WRONG_CHAIN: 'crypto_wrong_chain',
  CRYPTO_TX_FAILED: 'crypto_tx_failed',
  CRYPTO_PAYMENT_API_ERROR: 'crypto_payment_api_error',
  CHECKOUT_ERROR: 'checkout_error',
} as const;

type PaymentEvent = (typeof PaymentEvents)[keyof typeof PaymentEvents];

export const CheckoutSteps = {
  INIT: 'init',
  VERIFY: 'verify',
  SUBMIT: 'submit',
  CALLBACK: 'callback',
} as const;

type CheckoutStep = (typeof CheckoutSteps)[keyof typeof CheckoutSteps];

interface PaymentLogEvent {
  payment_method: PaymentMethod;
  event: PaymentEvent;
  error_message: string;
  error_code?: string;
  plan_id?: number;
  step?: CheckoutStep;
  timestamp: number;
}

/**
 * Fire-and-forget payment error logger.
 * Sends structured events to the backend for observability.
 * Errors in logging never affect the payment UX.
 */
export function usePaymentLogger(): {
  logPaymentEvent: (event: Omit<PaymentLogEvent, 'timestamp'>) => void;
} {
  function logPaymentEvent(event: Omit<PaymentLogEvent, 'timestamp'>): void {
    const payload: PaymentLogEvent = {
      ...event,
      timestamp: Date.now(),
    };

    $fetch('/api/logging/payment', {
      method: 'POST',
      body: payload,
    }).catch(() => {
      // Silently ignore — logging failures must never affect payment UX
    });
  }

  return { logPaymentEvent };
}

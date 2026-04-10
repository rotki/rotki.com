// Payment failure catalog — single source of truth.
// Each entry pairs the server-side event name (sent to /api/logging/payment)
// with the coarse Sigil `payment_failed.reason` category. Adding a new
// failure type means adding exactly one entry here, and both sides stay in
// sync.

import type { EnumValueOf } from './common';

export const PaymentFailures = {
  BRAINTREE_INIT_FAILED: { serverEvent: 'braintree_init_failed', reason: 'braintree_init' },
  THREE_DS_VERIFICATION_FAILED: { serverEvent: '3ds_verification_failed', reason: 'three_ds_failed' },
  THREE_DS_LIABILITY_SHIFT_FAILED: { serverEvent: '3ds_liability_shift_failed', reason: 'three_ds_failed' },
  CARD_PAYMENT_API_ERROR: { serverEvent: 'card_payment_api_error', reason: 'card_api_error' },
  PAYPAL_SDK_INIT_FAILED: { serverEvent: 'paypal_sdk_init_failed', reason: 'paypal_sdk_init' },
  PAYPAL_PAYMENT_ERROR: { serverEvent: 'paypal_payment_error', reason: 'paypal_payment' },
  PAYPAL_SUBMIT_ERROR: { serverEvent: 'paypal_submit_error', reason: 'paypal_submit' },
  CRYPTO_WALLET_NOT_CONNECTED: { serverEvent: 'crypto_wallet_not_connected', reason: 'crypto_wallet_not_connected' },
  CRYPTO_WRONG_CHAIN: { serverEvent: 'crypto_wrong_chain', reason: 'crypto_wrong_chain' },
  CRYPTO_INSUFFICIENT_FUNDS: { serverEvent: 'crypto_insufficient_funds', reason: 'crypto_insufficient_funds' },
  CRYPTO_USER_REJECTED: { serverEvent: 'crypto_user_rejected', reason: 'crypto_user_rejected' },
  CRYPTO_TX_FAILED: { serverEvent: 'crypto_tx_failed', reason: 'crypto_tx_failed' },
  CRYPTO_PAYMENT_API_ERROR: { serverEvent: 'crypto_payment_api_error', reason: 'crypto_api_error' },
  CHECKOUT_ERROR: { serverEvent: 'checkout_error', reason: 'checkout_error' },
} as const;

export type PaymentFailureKey = keyof typeof PaymentFailures;

export type PaymentFailedReason = EnumValueOf<typeof PaymentFailures>['reason'];

export type PaymentServerEvent = EnumValueOf<typeof PaymentFailures>['serverEvent'];

// Convenience: key → serverEvent string, preserving literal types.
export const PaymentServerEvents = Object.fromEntries(
  (Object.entries(PaymentFailures) as [PaymentFailureKey, (typeof PaymentFailures)[PaymentFailureKey]][])
    .map(([k, v]) => [k, v.serverEvent]),
) as { [K in PaymentFailureKey]: (typeof PaymentFailures)[K]['serverEvent'] };

const SERVER_EVENT_TO_REASON: Readonly<Record<string, PaymentFailedReason>> = Object.freeze(
  Object.fromEntries(
    Object.values(PaymentFailures).map(entry => [entry.serverEvent, entry.reason]),
  ) as Record<string, PaymentFailedReason>,
);

/**
 * Resolve a coarse Sigil `payment_failed.reason` from a server-side event name.
 * Use on the website side where callers already pass the server event string.
 */
export function reasonForServerEvent(serverEvent: PaymentServerEvent): PaymentFailedReason {
  // Safe: SERVER_EVENT_TO_REASON is built from the same catalog as PaymentServerEvent.
  return SERVER_EVENT_TO_REASON[serverEvent]!;
}

interface CryptoErrorShape {
  code?: string | number;
  shortMessage?: string;
  message?: string;
}

/**
 * Map an ethers/EIP-1193-shaped error from a crypto transaction attempt to a
 * specific `PaymentFailureKey`. Distinguishes user-rejected and
 * insufficient-funds failures from generic tx errors. No ethers runtime dep —
 * the function only duck-types the error.
 */
export function classifyCryptoTxError(error: unknown): PaymentFailureKey {
  const err = (error ?? {}) as CryptoErrorShape;
  const code = err.code;

  if (code === 'ACTION_REJECTED' || code === 4001)
    return 'CRYPTO_USER_REJECTED';

  if (code === 'INSUFFICIENT_FUNDS')
    return 'CRYPTO_INSUFFICIENT_FUNDS';

  const message = String(err.shortMessage ?? err.message ?? '').toLowerCase();

  if (message.includes('insufficient funds') || message.includes('insufficient balance') || message.includes('transfer amount exceeds balance'))
    return 'CRYPTO_INSUFFICIENT_FUNDS';

  if (message.includes('user rejected') || message.includes('user denied'))
    return 'CRYPTO_USER_REJECTED';

  return 'CRYPTO_TX_FAILED';
}

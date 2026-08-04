// Payment failure catalog — single source of truth.
// Each entry pairs the server-side event name (sent to /api/logging/payment)
// with the coarse Sigil `payment_failed.reason` category. Adding a new
// failure type means adding exactly one entry here, and both sides stay in
// sync.

import type { EnumValueOf } from './common';
import { z } from 'zod';

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

// Convenience: key → serverEvent string, preserving literal types. Built as an
// explicit literal (values derived from PaymentFailures, so no string duplication)
// so the precise per-key type is inferred with no assertion. `satisfies` enforces
// that every PaymentFailureKey is present — adding an entry above without adding it
// here is a compile error.
export const PaymentServerEvents = {
  BRAINTREE_INIT_FAILED: PaymentFailures.BRAINTREE_INIT_FAILED.serverEvent,
  THREE_DS_VERIFICATION_FAILED: PaymentFailures.THREE_DS_VERIFICATION_FAILED.serverEvent,
  THREE_DS_LIABILITY_SHIFT_FAILED: PaymentFailures.THREE_DS_LIABILITY_SHIFT_FAILED.serverEvent,
  CARD_PAYMENT_API_ERROR: PaymentFailures.CARD_PAYMENT_API_ERROR.serverEvent,
  PAYPAL_SDK_INIT_FAILED: PaymentFailures.PAYPAL_SDK_INIT_FAILED.serverEvent,
  PAYPAL_PAYMENT_ERROR: PaymentFailures.PAYPAL_PAYMENT_ERROR.serverEvent,
  PAYPAL_SUBMIT_ERROR: PaymentFailures.PAYPAL_SUBMIT_ERROR.serverEvent,
  CRYPTO_WALLET_NOT_CONNECTED: PaymentFailures.CRYPTO_WALLET_NOT_CONNECTED.serverEvent,
  CRYPTO_WRONG_CHAIN: PaymentFailures.CRYPTO_WRONG_CHAIN.serverEvent,
  CRYPTO_INSUFFICIENT_FUNDS: PaymentFailures.CRYPTO_INSUFFICIENT_FUNDS.serverEvent,
  CRYPTO_USER_REJECTED: PaymentFailures.CRYPTO_USER_REJECTED.serverEvent,
  CRYPTO_TX_FAILED: PaymentFailures.CRYPTO_TX_FAILED.serverEvent,
  CRYPTO_PAYMENT_API_ERROR: PaymentFailures.CRYPTO_PAYMENT_API_ERROR.serverEvent,
  CHECKOUT_ERROR: PaymentFailures.CHECKOUT_ERROR.serverEvent,
} satisfies Record<PaymentFailureKey, PaymentServerEvent>;

const SERVER_EVENT_TO_REASON: Readonly<Record<string, PaymentFailedReason>> = Object.freeze(
  Object.fromEntries(
    Object.values(PaymentFailures).map((entry): [string, PaymentFailedReason] => [entry.serverEvent, entry.reason]),
  ),
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
  const err: CryptoErrorShape = typeof error === 'object' && error !== null ? error : {};
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

// The schemas below describe third-party error objects we do not control, so
// every field is `.catch(undefined)`: one unexpected field type degrades that
// field only, and never discards the rest of an otherwise usable error.

/**
 * Cardinal's original error, attached by braintree-web as
 * `details.originalError` when Songbird reports `ActionCode: "ERROR"`.
 * See braintree-web `three-d-secure/external/frameworks/songbird.js`: `code`
 * is Cardinal's numeric `ErrorNumber`, `description` its `ErrorDescription`.
 */
const cardinalOriginalErrorSchema = z.object({
  code: z.union([z.string(), z.number()]).optional().catch(undefined),
  description: z.string().optional().catch(undefined),
});

/** A nested `Error`-like rejection, e.g. the gateway request failure that
 * `_performJWTValidation` wraps into `details.originalError`. */
const nestedErrorSchema = z.object({
  message: z.string().optional().catch(undefined),
});

/**
 * Shape of a `BraintreeError` (braintree-web `lib/braintree-error`). Described
 * structurally so neither sigil nor its consumers need a braintree-web
 * dependency. `details.originalError` stays `unknown`: it is narrowed
 * separately, since its shape depends on which layer failed.
 */
const braintreeErrorSchema = z.object({
  code: z.string().optional().catch(undefined),
  type: z.string().optional().catch(undefined),
  message: z.string().optional().catch(undefined),
  details: z.object({ originalError: z.unknown() }).optional().catch(undefined),
});

export interface ParsedPaymentError {
  /** Plain message, safe to surface in the UI. */
  message: string;
  /** `message` plus the Cardinal original error. Log this, don't render it. */
  logMessage: string;
  /** BraintreeError `code` (e.g. `THREEDS_CARDINAL_SDK_ERROR`), when the error is one. */
  code?: string;
}

/**
 * Describe `details.originalError`. Cardinal's `{ code, description }` is the
 * interesting case: braintree-web collapses every unmapped Cardinal
 * `ErrorNumber` into the single generic `THREEDS_CARDINAL_SDK_ERROR` code, so
 * the number here is the only thing that identifies the actual failure.
 */
function describeCardinalError(original: unknown): string | undefined {
  const cardinal = cardinalOriginalErrorSchema.safeParse(original);
  if (!cardinal.success)
    return undefined;

  const { code, description } = cardinal.data;
  const parts: string[] = [];

  if (code !== undefined && code !== '')
    parts.push(`cardinal ${code}`);

  if (description)
    parts.push(description);

  return parts.length > 0 ? parts.join(': ') : undefined;
}

function describeOriginalError(original: unknown): string | undefined {
  if (original === undefined || original === null)
    return undefined;

  if (typeof original === 'string')
    return original || undefined;

  const cardinal = describeCardinalError(original);
  if (cardinal)
    return cardinal;

  const nested = nestedErrorSchema.safeParse(original);
  return nested.success ? nested.data.message : undefined;
}

/**
 * Turn an unknown rejection from the Braintree/Cardinal 3D Secure flow into a
 * loggable message plus a stable error code.
 *
 * The SDK rejects with a `BraintreeError` whose `message` is prose and whose
 * real discriminator lives on `code` and `details.originalError`. Logging only
 * `error.message` throws that away, and a non-`Error` rejection degrades to a
 * bare `String(error)` (this is how an `error_message` of `"26"` reaches the
 * logs with nothing left to identify it).
 */
export function parseBraintreeError(error: unknown): ParsedPaymentError {
  if (typeof error === 'string') {
    const message = error || 'Unknown error';
    return { message, logMessage: message };
  }

  const parsed = braintreeErrorSchema.safeParse(error);
  if (!parsed.success) {
    const message = String(error);
    return { message, logMessage: message };
  }

  const { code, type, message, details } = parsed.data;
  const original = describeOriginalError(details?.originalError);

  // Fall back through code/type before the raw stringification, so an object
  // with no `message` still logs something the backend will accept (it rejects
  // an empty `error_message` with a 400).
  const base = message || code || type || String(error);

  return {
    message: base,
    logMessage: original ? `${base} (${original})` : base,
    ...(code ? { code } : {}),
  };
}

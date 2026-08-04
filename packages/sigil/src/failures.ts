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
const CardinalOriginalErrorSchema = z.object({
  code: z.union([z.string(), z.number()]).optional().catch(undefined),
  description: z.string().optional().catch(undefined),
});

/** A nested `Error`-like rejection, e.g. the gateway request failure that
 * `_performJWTValidation` wraps into `details.originalError`. */
const NestedErrorSchema = z.object({
  message: z.string().optional().catch(undefined),
});

/**
 * Shape of a `BraintreeError` (braintree-web `lib/braintree-error`). Described
 * structurally so neither sigil nor its consumers need a braintree-web
 * dependency. `details.originalError` stays `unknown`: it is narrowed
 * separately, since its shape depends on which layer failed.
 */
const BraintreeErrorSchema = z.object({
  code: z.string().optional().catch(undefined),
  type: z.string().optional().catch(undefined),
  message: z.string().optional().catch(undefined),
  details: z.object({ originalError: z.unknown() }).optional().catch(undefined),
});

/**
 * An error whose message we wrote for the buyer.
 *
 * Throw this instead of a plain `Error` when the message is meant to be read by
 * a customer. Being told so is the only way `parseBraintreeError` can know: an
 * ofetch `FetchError`, a `TypeError` from a bug of ours and a deliberate piece
 * of copy are all just `Error`s with a `message`, and only one of them may be
 * rendered.
 *
 * @param logDetail diagnostic to append to `logMessage` only. The message is
 * customer copy, so it rarely says which card or plan was involved; this is
 * where that goes.
 */
export class PaymentUserError extends Error {
  /** Structural marker: survives bundling and duplicate package copies, unlike `instanceof`. */
  readonly userFacing = true;
  readonly logDetail?: string;

  constructor(message: string, options?: { logDetail?: string }) {
    super(message);
    this.name = 'PaymentUserError';
    this.logDetail = options?.logDetail;
  }
}

const UserErrorSchema = z.object({
  userFacing: z.literal(true).optional().catch(undefined),
  logDetail: z.string().optional().catch(undefined),
  message: z.string().optional().catch(undefined),
});

/**
 * Who a parsed error's `message` was written for, and therefore whether it can
 * be rendered as-is. Derived from the BraintreeError `type`, which is the only
 * signal the SDK gives about its own copy: braintree-web writes `CUSTOMER`
 * messages for the buyer and the rest for whoever is integrating it.
 */
export const PaymentErrorAudiences = {
  /** A `PaymentUserError`, so `message` is copy we wrote for the buyer. */
  OWN: 'own',
  /** The buyer or their bank caused it, and can act on it. Safe to render. */
  CUSTOMER: 'customer',
  /** A connectivity failure. Render our own retry copy. */
  NETWORK: 'network',
  /** `MERCHANT`/`INTERNAL`/`UNKNOWN`, or unrecognisable: developer prose. Never render it. */
  OPAQUE: 'opaque',
} as const;

export type PaymentErrorAudience = EnumValueOf<typeof PaymentErrorAudiences>;

export interface ParsedPaymentError {
  /** Plain message. Render it only when `audience` allows, see `PaymentErrorAudiences`. */
  message: string;
  /** `message` plus the Cardinal original error. Log this, don't render it. */
  logMessage: string;
  /** BraintreeError `code` (e.g. `THREEDS_CARDINAL_SDK_ERROR`), when the error is one. */
  code?: string;
  /** Whether `message` is fit to show the buyer. */
  audience: PaymentErrorAudience;
}

/**
 * Classify by the BraintreeError `type`.
 *
 * Note what this deliberately does not do: infer `OWN` from the *absence* of
 * `code` and `type`. Everything that is not a BraintreeError lacks both, so
 * that test would hand a `FetchError`'s `[POST] "/webapi/...": 500` straight to
 * the buyer. `OWN` is only ever granted to a `PaymentUserError`, which says so.
 */
function audienceFor(type: string | undefined): PaymentErrorAudience {
  if (type === 'CUSTOMER')
    return PaymentErrorAudiences.CUSTOMER;

  if (type === 'NETWORK')
    return PaymentErrorAudiences.NETWORK;

  return PaymentErrorAudiences.OPAQUE;
}

/**
 * What a buyer should be told about a parsed payment error, minus the words.
 *
 * The words themselves cannot live here: the website translates through
 * vue-i18n while the card-payment SPA carries literal English. What both need
 * is the same decision about *which* of the three things to say, above all
 * whether the SDK's own message may be rendered at all, so that lives here and
 * each app only supplies copy.
 */
export type PaymentErrorCopy =
  /** Show `message` as-is: either we wrote it, or it is a `CUSTOMER` error the buyer can act on. */
  | { kind: 'verbatim'; message: string }
  /** Show connectivity copy, e.g. "check your connection and try again". */
  | { kind: 'network' }
  /**
   * Show generic copy. The SDK's message is developer prose and must not be
   * rendered; `code` is a stable caps-string identifier ("THREEDS_CARDINAL_SDK_ERROR")
   * that is safe to quote as a support reference when present.
   */
  | { kind: 'unexpected'; code?: string };

/**
 * Decide what to tell the buyer about a parsed error. Pair it with
 * `parseBraintreeError`, whose `logMessage` is what you send to the logs.
 */
export function paymentErrorCopy({ message, code, audience }: ParsedPaymentError): PaymentErrorCopy {
  if (audience === PaymentErrorAudiences.OWN || audience === PaymentErrorAudiences.CUSTOMER)
    return { kind: 'verbatim', message };

  if (audience === PaymentErrorAudiences.NETWORK)
    return { kind: 'network' };

  return code ? { kind: 'unexpected', code } : { kind: 'unexpected' };
}

/**
 * Describe `details.originalError`. Cardinal's `{ code, description }` is the
 * interesting case: braintree-web collapses every unmapped Cardinal
 * `ErrorNumber` into the single generic `THREEDS_CARDINAL_SDK_ERROR` code, so
 * the number here is the only thing that identifies the actual failure.
 */
function describeCardinalError(original: unknown): string | undefined {
  const cardinal = CardinalOriginalErrorSchema.safeParse(original);
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

  const nested = NestedErrorSchema.safeParse(original);
  return nested.success ? nested.data.message : undefined;
}

/**
 * Recognise copy we wrote, the only thing that earns `OWN`.
 *
 * Tried before the BraintreeError shape, because a `PaymentUserError` matches
 * that schema too (both are objects with a `message`) and would otherwise be
 * classified as opaque developer prose.
 */
function parseUserError(error: unknown): ParsedPaymentError | undefined {
  const own = UserErrorSchema.safeParse(error);
  if (!own.success || own.data.userFacing !== true || !own.data.message)
    return undefined;

  const { message, logDetail } = own.data;

  return {
    message,
    logMessage: logDetail ? `${message} (${logDetail})` : message,
    audience: PaymentErrorAudiences.OWN,
  };
}

/**
 * The best single line describing a BraintreeError.
 *
 * Falls back through `code` and `type` before the raw stringification, so an
 * object with no `message` still logs something the backend will accept (it
 * rejects an empty `error_message` with a 400). None of the fallbacks is a
 * sentence anyone wrote, which is why reaching them can never mean `OWN`.
 */
function describeBraintreeError(error: unknown, parsed: z.infer<typeof BraintreeErrorSchema>): string {
  return parsed.message || parsed.code || parsed.type || String(error);
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
  // A bare string or a non-object rejection is unattributable: it may be
  // third-party prose, or the `26` that started all this. Log it, never show it.
  if (typeof error === 'string') {
    const message = error || 'Unknown error';
    return { message, logMessage: message, audience: PaymentErrorAudiences.OPAQUE };
  }

  const own = parseUserError(error);
  if (own)
    return own;

  const parsed = BraintreeErrorSchema.safeParse(error);
  if (!parsed.success) {
    const message = String(error);
    return { message, logMessage: message, audience: PaymentErrorAudiences.OPAQUE };
  }

  const { code, type, details } = parsed.data;
  const original = describeOriginalError(details?.originalError);
  const base = describeBraintreeError(error, parsed.data);

  return {
    message: base,
    logMessage: original ? `${base} (${original})` : base,
    ...(code ? { code } : {}),
    audience: audienceFor(type),
  };
}

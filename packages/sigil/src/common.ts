// Common Sigil enums shared by event payloads, the failure catalog, and
// host-package call sites. Each is an `as const` object so values are usable
// at runtime and types are derived from the same source via `EnumValueOf`.

/**
 * Derive a string-literal union from the values of a const enum-like object.
 * Internal sigil helper — used to give every "enum" exactly one source of
 * truth (the `as const` object) without restating the value union.
 */
export type EnumValueOf<T> = T[keyof T];

export const CheckoutPaymentMethods = {
  CARD: 'card',
  PAYPAL: 'paypal',
  CRYPTO: 'crypto',
} as const;

export type CheckoutPaymentMethod = EnumValueOf<typeof CheckoutPaymentMethods>;

export const CardTypes = {
  SAVED: 'saved',
  NEW: 'new',
} as const;

export type CardType = EnumValueOf<typeof CardTypes>;

export const CheckoutSteps = {
  INIT: 'init',
  VERIFY: 'verify',
  SUBMIT: 'submit',
  CALLBACK: 'callback',
} as const;

export type CheckoutStep = EnumValueOf<typeof CheckoutSteps>;

export const PlanDurations = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export type PlanDuration = EnumValueOf<typeof PlanDurations>;

export const DiscountTypes = {
  REFERRAL: 'referral',
  DISCOUNT: 'discount',
} as const;

export type DiscountType = EnumValueOf<typeof DiscountTypes>;

export const DiscountRejectedReasons = {
  INVALID: 'invalid',
  EXPIRED: 'expired',
  NOT_APPLICABLE: 'not_applicable',
  SERVER_ERROR: 'server_error',
} as const;

export type DiscountRejectedReason = EnumValueOf<typeof DiscountRejectedReasons>;

// Auth failure reasons

export const SignupFailedReasons = {
  VALIDATION: 'validation',
  SERVER_ERROR: 'server_error',
} as const;

export type SignupFailedReason = EnumValueOf<typeof SignupFailedReasons>;

export const LoginFailedReasons = {
  INVALID_CREDENTIALS: 'invalid_credentials',
} as const;

export type LoginFailedReason = EnumValueOf<typeof LoginFailedReasons>;

export const ActivationFailedReasons = {
  INVALID_TOKEN: 'invalid_token',
  SERVER_ERROR: 'server_error',
} as const;

export type ActivationFailedReason = EnumValueOf<typeof ActivationFailedReasons>;

/**
 * Convert a plan length in months to its analytics-ready interval. Anything
 * other than a 1-month plan (including unknown) is treated as yearly, which
 * matches the previously-inlined ternaries at every call site.
 */
export function monthsToPlanDuration(months: number | undefined): PlanDuration {
  return months === 1 ? PlanDurations.MONTHLY : PlanDurations.YEARLY;
}

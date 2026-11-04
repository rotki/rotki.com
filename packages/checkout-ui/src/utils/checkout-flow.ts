/** The steps the shared checkout stepper shows, in order. 3D Secure is part of `payment`. */
export const CHECKOUT_STEPS = ['plan', 'payment', 'confirmation'] as const;

export type CheckoutStepId = typeof CHECKOUT_STEPS[number];

/** The payment methods the method tiles offer, in display order. */
export const CHECKOUT_METHODS = ['card', 'paypal', 'crypto'] as const;

export type CheckoutMethodId = typeof CHECKOUT_METHODS[number];

export interface MethodLink {
  /** The method's payment page. Tiles are plain links, so every switch is a full page load. */
  href: string;
  /** Shown but not followable, e.g. while Braintree (card and PayPal) is unavailable. */
  disabled?: boolean;
}

/** The methods a page offers; a method without an entry is left out. */
export type MethodLinks = Partial<Record<CheckoutMethodId, MethodLink>>;

/** Each method's payment page on rotki.com. */
export const CHECKOUT_METHOD_PATHS: Record<CheckoutMethodId, string> = {
  card: '/checkout/pay/card',
  crypto: '/checkout/pay/request-crypto',
  paypal: '/checkout/pay/paypal',
};

/** Query params that carry over between the checkout pages, in the order they are written. */
export const CARRIED_CHECKOUT_PARAMS = ['planId', 'ref', 'discountCode', 'id'] as const;

/** What the buyer chose so far: plan, referral, explicit discount code, and the subscription a renewal pays. */
export type CheckoutParams = Partial<Record<typeof CARRIED_CHECKOUT_PARAMS[number], string | number | undefined>>;

/** The carried params as a query string with its `?`, or an empty string when there are none. */
export function checkoutSearch(params: CheckoutParams): string {
  const query = new URLSearchParams();
  for (const key of CARRIED_CHECKOUT_PARAMS) {
    const value = params[key];
    if (value !== undefined && value !== '')
      query.set(key, String(value));
  }
  const search = query.toString();
  return search ? `?${search}` : '';
}

export interface MethodLinksOptions {
  /** Prefixed to each path; the card app runs on its own origin in development. */
  base?: string;
  params: CheckoutParams;
  /** Braintree is down, so card and PayPal show but cannot be followed. */
  braintreeUnavailable?: boolean;
}

/**
 * The method tiles' links, keeping what the buyer chose. A renewal (`id`) renews a crypto
 * subscription, which only a crypto payment can pay, so it is offered nothing else.
 */
export function buildMethodLinks({ base = '', params, braintreeUnavailable = false }: MethodLinksOptions): MethodLinks {
  const search = checkoutSearch(params);
  const href = (method: CheckoutMethodId): string => `${base}${CHECKOUT_METHOD_PATHS[method]}${search}`;
  if (params.id)
    return { crypto: { href: href('crypto') } };
  return {
    card: { disabled: braintreeUnavailable, href: href('card') },
    crypto: { href: href('crypto') },
    paypal: { disabled: braintreeUnavailable, href: href('paypal') },
  };
}

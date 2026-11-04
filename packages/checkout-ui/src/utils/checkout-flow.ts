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

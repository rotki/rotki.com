/**
 * Centralized navigation configuration and utilities for card payment app
 */
import { buildMethodLinks, CARRIED_CHECKOUT_PARAMS, type CheckoutParams, checkoutSearch, type MethodLinks } from '@rotki/checkout-ui/utils/checkout-flow';
import { paths } from '@/config/paths';

/**
 * Route definitions for the card payment application
 */
export const routes = {
  billing: `${paths.hostUrlBase}/home/billing`,
  home: paths.hostUrlBase,
  plans: `${paths.hostUrlBase}/checkout/pay`,
  refundPolicy: `${paths.hostUrlBase}/refund-policy`,
  subscription: `${paths.hostUrlBase}/home/subscription`,
  threeDSecure: `${paths.hostUrlBase}/checkout/pay/3d-secure`,
} as const;

/** The checkout params of the current URL: plan, referral, explicit discount code, renewal subscription. */
function currentCheckoutParams(): CheckoutParams {
  return Object.fromEntries(CARRIED_CHECKOUT_PARAMS.map(key => [key, getUrlParam(key) ?? undefined]));
}

/** Adds the current URL's checkout params to `href`, so a link to another checkout page keeps what the buyer chose. */
export function withCheckoutParams(href: string): string {
  return `${href}${checkoutSearch(currentCheckoutParams())}`;
}

/** Links for the method tiles, to the checkout pages on rotki.com. */
export function checkoutMethodLinks(): MethodLinks {
  return buildMethodLinks({ base: paths.hostUrlBase, params: currentCheckoutParams() });
}

/**
 * Navigation utility functions
 */
export const navigation = {
  /**
   * Navigate to 3D Secure verification
   */
  goTo3DSecure(upgradeSubId: string | null): void {
    const href = routes.threeDSecure;
    window.location.href = upgradeSubId ? `${href}?upgradeSubId=${upgradeSubId}` : href;
  },

  /** Back to the plans, keeping the buyer's plan, referral and discount code. */
  goToPlans(): void {
    window.location.href = withCheckoutParams(routes.plans);
  },

  /**
   * Navigate to subscription management page
   */
  goToSubscription(): void {
    window.location.href = routes.subscription;
  },
};

/**
 * Extract query parameters from URL
 */
export function getUrlParams(): URLSearchParams {
  if (typeof window === 'undefined') {
    return new URLSearchParams();
  }
  return new URLSearchParams(window.location.search);
}

/**
 * Get a specific query parameter value
 * @param key - The parameter key
 * @param defaultValue - Default value if parameter is not found
 */
export function getUrlParam(key: string, defaultValue?: string): string | null {
  const params = getUrlParams();
  return nonEmpty(params.get(key)) ?? nonEmpty(defaultValue) ?? null;
}

/** `undefined` for a missing or empty string, so an empty `?key=` still falls back. */
function nonEmpty(value: string | null | undefined): string | undefined {
  return value === null || value === '' ? undefined : value;
}

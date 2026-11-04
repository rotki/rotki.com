/**
 * Centralized navigation configuration and utilities for card payment app
 */
import type { MethodLinks } from '@rotki/checkout-ui/utils/checkout-flow';
import { paths } from '@/config/paths';

/**
 * Route definitions for the card payment application
 */
export const routes = {
  cryptoRequest: `${paths.hostUrlBase}/checkout/pay/request-crypto`,
  home: paths.hostUrlBase,
  paymentMethod: `${paths.hostUrlBase}/checkout/pay/method`,
  paypal: `${paths.hostUrlBase}/checkout/pay/paypal`,
  plans: `${paths.hostUrlBase}/checkout/pay`,
  refundPolicy: `${paths.hostUrlBase}/refund-policy`,
  subscription: `${paths.hostUrlBase}/home/subscription`,
  threeDSecure: `${paths.hostUrlBase}/checkout/pay/3d-secure`,
} as const;

/** Checkout query params that carry over between the website's checkout pages and this app. */
const CARRIED_PARAMS = ['planId', 'ref', 'discountCode', 'id'] as const;

/**
 * Adds the checkout params of the current URL (plan, referral, explicit discount code, renewal
 * subscription) to `href`, so a link to another checkout page keeps what the buyer chose.
 */
export function withCheckoutParams(href: string): string {
  const params = new URLSearchParams();
  for (const key of CARRIED_PARAMS) {
    const value = getUrlParam(key);
    if (value)
      params.set(key, value);
  }
  const query = params.toString();
  return query ? `${href}?${query}` : href;
}

/** Links for the method tiles: this page for card, the website's pages for PayPal and crypto. */
export function checkoutMethodLinks(): MethodLinks {
  return {
    card: { href: withCheckoutParams(paths.appUrlBase) },
    crypto: { href: withCheckoutParams(routes.cryptoRequest) },
    paypal: { href: withCheckoutParams(routes.paypal) },
  };
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

  /**
   * Navigate to home page
   */
  goToHome(): void {
    window.location.href = routes.home;
  },

  /**
   * Navigate back to payment method selection
   * @param planId - Plan to keep selected; left out of the URL when empty
   * @param referralCode - Carried over as `ref` so the referral discount is not lost
   */
  goToPaymentMethod(planId: string | undefined, referralCode?: string | null): void {
    const href = routes.paymentMethod;
    const params = new URLSearchParams();

    if (planId) {
      params.set('planId', planId);
    }

    if (referralCode) {
      params.set('ref', referralCode);
    }

    const queryString = params.toString();
    window.location.href = queryString ? `${href}?${queryString}` : href;
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

export function getDurationFromUrlParam(key: string): string {
  const params = getUrlParam(key);
  if (!params || params === '12') {
    return '12';
  }

  return '1';
}

/**
 * Get numeric query parameter value
 * @param key - The parameter key
 * @param defaultValue - Default value if parameter is not found or invalid
 */
export function getNumericUrlParam(key: string, defaultValue: number): number {
  const value = getUrlParam(key);
  if (!value)
    return defaultValue;

  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

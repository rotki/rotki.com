/**
 * Centralized navigation configuration and utilities for card payment app
 */
import { paths } from '@/config/paths';

/**
 * Route definitions for the card payment application
 */
export const routes = {
  home: paths.hostUrlBase,
  paymentMethod: `${paths.hostUrlBase}/checkout/pay/method`,
  refundPolicy: `${paths.hostUrlBase}/refund-policy`,
  subscription: `${paths.hostUrlBase}/home/subscription`,
  threeDSecure: `${paths.hostUrlBase}/checkout/pay/3d-secure`,
} as const;

/**
 * Navigation utility functions
 */
export const navigation = {
  /**
   * Navigate to 3D Secure verification
   */
  goTo3DSecure(): void {
    window.location.href = routes.threeDSecure;
  },

  /**
   * Navigate to home page
   */
  goToHome(): void {
    window.location.href = routes.home;
  },

  /**
   * Navigate back to payment method selection
   * @param planId - The plan ID
   */
  goToPaymentMethod(planId: string | undefined): void {
    const href = `${routes.paymentMethod}`;
    window.location.href = planId ? `${href}?planId=${planId}` : href;
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
  return params.get(key) || defaultValue || null;
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

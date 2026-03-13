import { PAYMENT_COMPLETED_KEY } from '~/modules/checkout/constants';

/**
 * Client-only middleware to protect payment success pages
 * Only allows access when user has just completed a payment
 */
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) {
    return;
  }

  if (!sessionStorage.getItem(PAYMENT_COMPLETED_KEY)) {
    return navigateTo('/home/subscription');
  }

  // Remove the flag after successful access
  sessionStorage.removeItem(PAYMENT_COMPLETED_KEY);
});

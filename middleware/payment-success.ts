/**
 * Client-only middleware to protect payment success pages
 * Only allows access when user has just completed a payment
 */
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) {
    return;
  }

  if (!sessionStorage.getItem('payment-completed')) {
    return navigateTo('/home/subscription');
  }

  // Remove the flag after successful access
  sessionStorage.removeItem('payment-completed');
});

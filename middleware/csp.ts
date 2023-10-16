import { isClient } from '@vueuse/core';

/**
 * Middleware is supposed to force a fetch disruption in the SPA navigation
 * and force the route to reload from the server.
 */
export default defineNuxtRouteMiddleware((to, from) => {
  if (isClient && from.path === '/checkout/pay/method') {
    setTimeout(() => {
      window.location.href = to.fullPath;
    }, 100);
    return abortNavigation();
  }
});

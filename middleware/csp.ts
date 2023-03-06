import { isClient } from '@vueuse/core'

/**
 * Middleware is supposed to force a fetch disruption in the SPA navigation
 * and force the route to reload from the server.
 */
defineNuxtRouteMiddleware((to, from) => {
  if (isClient) {
    if (from.path === '/checkout/payment-method') {
      useTimeoutFn(() => {
        window.location.href = to.fullPath
      }, 100)
      return abortNavigation()
    }
  }
})

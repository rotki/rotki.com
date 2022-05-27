import { isClient } from '@vueuse/core'
// eslint-disable-next-line import/named
import { Route } from 'vue-router'

export function beforeRouteEnter(to: Route, from: Route, next: Function) {
  if (isClient) {
    if (from.path === '/checkout/payment-method') {
      next(false)
      window.location.href = to.fullPath
    } else {
      next()
    }
  } else {
    next()
  }
}

export function beforeRouteLeave(to: Route, _from: Route, next: Function) {
  next(false)
  window.location.href = to.fullPath
}

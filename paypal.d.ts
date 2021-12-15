import paypal from 'paypal-checkout-components'

declare global {
  interface Window {
    paypal?: typeof paypal
  }
}

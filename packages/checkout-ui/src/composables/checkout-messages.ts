import type { CheckoutTranslate } from '../utils/translator';
import { type App, inject, type InjectionKey, provide } from 'vue';

const checkoutMessagesKey: InjectionKey<CheckoutTranslate> = Symbol('checkout-messages');

/**
 * Supplies the translate function to every shared checkout component in the app. The website
 * passes vue-i18n's `t` from a Nuxt plugin; the card payment app passes
 * `createTranslator(checkoutMessages)` while setting up its app.
 */
export function installCheckoutMessages(app: App, translate: CheckoutTranslate): void {
  app.provide(checkoutMessagesKey, translate);
}

/**
 * Supplies the translate function to the shared checkout components below the calling
 * component only. Mostly for tests and previews; apps use `installCheckoutMessages`.
 */
export function provideCheckoutMessages(translate: CheckoutTranslate): void {
  provide(checkoutMessagesKey, translate);
}

/**
 * Returns the translate function supplied by `installCheckoutMessages` or
 * `provideCheckoutMessages`. Throws when none was supplied, so a missing setup fails loudly
 * in development and tests instead of showing keys.
 */
export function useCheckoutMessages(): CheckoutTranslate {
  const translate = inject(checkoutMessagesKey, undefined);
  if (!translate)
    throw new Error('useCheckoutMessages() needs installCheckoutMessages() or provideCheckoutMessages()');

  return translate;
}

import type { CheckoutTranslate } from '../utils/translator';
import { inject, type InjectionKey, provide } from 'vue';

const checkoutMessagesKey: InjectionKey<CheckoutTranslate> = Symbol('checkout-messages');

/**
 * Supplies the translate function the shared checkout components use. The website passes
 * vue-i18n's `t`; the card payment app passes `createTranslator(messages)`. Call it in the
 * setup of a component above the checkout components (a layout or the app root).
 */
export function provideCheckoutMessages(translate: CheckoutTranslate): void {
  provide(checkoutMessagesKey, translate);
}

/**
 * Returns the translate function provided by `provideCheckoutMessages`. Throws when none was
 * provided, so a missing setup fails loudly in development and tests instead of showing keys.
 */
export function useCheckoutMessages(): CheckoutTranslate {
  const translate = inject(checkoutMessagesKey, undefined);
  if (!translate)
    throw new Error('useCheckoutMessages() needs provideCheckoutMessages() in a parent component');

  return translate;
}

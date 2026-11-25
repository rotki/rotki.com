import { installCheckoutMessages } from '@rotki/checkout-ui/composables/checkout-messages';
import { defineNuxtPlugin } from '#app';

/**
 * Gives the shared checkout components (the checkout-ui package) vue-i18n's translate function.
 * Their copy is loaded as a second locale file, i18n/locales/checkout.ts.
 */
export default defineNuxtPlugin((nuxtApp) => {
  installCheckoutMessages(nuxtApp.vueApp, (key, params) => nuxtApp.$i18n.t(key, params ?? {}));
});

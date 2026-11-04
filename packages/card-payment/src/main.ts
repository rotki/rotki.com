import { installCheckoutMessages } from '@rotki/checkout-ui/composables/checkout-messages';
import { checkoutMessages } from '@rotki/checkout-ui/messages/en';
import { createTranslator } from '@rotki/checkout-ui/utils/translator';
import { setSigilDebug } from '@rotki/sigil';
import { createRui } from '@rotki/ui-library';
import { ViteSSG, type ViteSSGContext } from 'vite-ssg/single-page';
import App from './App.vue';
import '@fontsource-variable/inter/opsz.css';
import '@fontsource-variable/geist-mono';
import './assets/styles/main.css';

if (import.meta.env.VITE_SIGIL_DEBUG === 'true') {
  setSigilDebug(true);
}

/** App setup for single-page SSG: a global error handler, the rotki UI library and the shared checkout copy. */
function setupApp({ app }: ViteSSGContext<false>): void {
  app.config.errorHandler = (err, _instance, info) => {
    console.error('Global error:', err, info);
  };

  const rui = createRui({
    theme: {
      mode: 'light',
    },
  });
  app.use(rui);
  installCheckoutMessages(app, createTranslator(checkoutMessages));
}

export const createApp = ViteSSG(App, setupApp);

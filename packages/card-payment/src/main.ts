import { setSigilDebug } from '@rotki/sigil';
import { createRui } from '@rotki/ui-library';
import { ViteSSG, type ViteSSGContext } from 'vite-ssg/single-page';
import App from './App.vue';
import '@fontsource/roboto/latin.css';
import './assets/styles/main.css';
import '@rotki/ui-library/style.css';

if (import.meta.env.VITE_SIGIL_DEBUG === 'true') {
  setSigilDebug(true);
}

/** App setup for single-page SSG: a global error handler and the rotki UI library. */
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
}

export const createApp = ViteSSG(App, setupApp);

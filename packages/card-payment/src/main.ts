import { createRui } from '@rotki/ui-library';
import { ViteSSG } from 'vite-ssg/single-page';
import App from './App.vue';
import '@fontsource/roboto/latin.css';
import './assets/styles/main.css';
import '@rotki/ui-library/style.css';

// For single-page SSG, the setup is simplified
export const createApp = ViteSSG(App, ({ app }) => {
  // Global error handler
  app.config.errorHandler = (err, _instance, info) => {
    console.error('Global error:', err, info);
  };

  const rui = createRui({
    theme: {
      mode: 'light',
    },
  });
  app.use(rui);
});

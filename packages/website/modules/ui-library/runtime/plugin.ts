import { defineNuxtPlugin } from '#app';
import { createRui } from '@rotki/ui-library';
import icons from 'virtual:rotki-icons';

export default defineNuxtPlugin((nuxtApp) => {
  const RuiPlugin = createRui({
    theme: {
      icons,
      mode: 'light',
    },
  });

  nuxtApp.vueApp.use(RuiPlugin);
});

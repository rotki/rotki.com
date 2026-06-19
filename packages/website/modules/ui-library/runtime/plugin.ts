import { createRui } from '@rotki/ui-library';
import icons from 'virtual:rotki-icons';
import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  const RuiPlugin = createRui({
    theme: {
      icons,
      mode: 'light',
    },
  });

  nuxtApp.vueApp.use(RuiPlugin);
});

import { createRui } from '@rotki/ui-library';
import icons from 'virtual:rotki-icons';
import { defineNuxtPlugin } from '#app';
import { brandIcons } from './brand-icons';

export default defineNuxtPlugin((nuxtApp) => {
  const RuiPlugin = createRui({
    theme: {
      icons: [...icons, ...brandIcons],
      mode: 'light',
    },
  });

  nuxtApp.vueApp.use(RuiPlugin);
});

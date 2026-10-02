import { createRui } from '@rotki/ui-library';
import icons from 'virtual:rotki-icons';
import { defineNuxtPlugin } from '#app';
import { brandIcons } from './brand-icons';
import { createSeasonalLogoResolver } from './logo-resolver';

export default defineNuxtPlugin((nuxtApp) => {
  const RuiPlugin = createRui({
    theme: {
      icons: [...icons, ...brandIcons],
      mode: 'light',
    },
    logo: {
      resolve: createSeasonalLogoResolver(),
    },
  });

  nuxtApp.vueApp.use(RuiPlugin);
});

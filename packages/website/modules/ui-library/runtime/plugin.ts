import { createRui } from '@rotki/ui-library';
import { get, until } from '@vueuse/shared';
import icons from 'virtual:rotki-icons';
import { defineNuxtPlugin } from '#app';
import { useAppConfig } from '~/composables/use-app-config';
import { brandIcons } from './brand-icons';
import { createRotkiDataLogoResolver } from './logo-resolver';

/** How long the logo waits for `/api/config` to pick the rotki/data branch before using `main`. */
const CONFIG_WAIT_MS = 5000;

export default defineNuxtPlugin((nuxtApp) => {
  const { configReady, contentBranch } = useAppConfig();

  const RuiPlugin = createRui({
    theme: {
      icons: [...icons, ...brandIcons],
      mode: 'light',
    },
    logo: {
      // The branch comes from `/api/config`, loaded in the browser, so wait for it before choosing one
      resolve: createRotkiDataLogoResolver(async (): Promise<string> => {
        await until(configReady).toBe(true, { timeout: CONFIG_WAIT_MS });
        return get(contentBranch);
      }),
    },
  });

  nuxtApp.vueApp.use(RuiPlugin);
});

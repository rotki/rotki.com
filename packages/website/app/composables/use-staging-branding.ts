import type { Ref } from 'vue';
import { createSharedComposable } from '@vueuse/core';
import { get } from '@vueuse/shared';

const STAGING_HOSTNAME = 'staging.rotki.com';
const LOCALHOST = 'localhost';

interface UseStagingBrandingReturn { isStaging: Readonly<Ref<boolean>> }

export const useStagingBranding = createSharedComposable((): UseStagingBrandingReturn => {
  const { isDev } = useRuntimeConfig().public;

  // Get the request URL at setup time (when Nuxt instance is available)
  // to avoid "[nuxt] instance unavailable" errors when computed is evaluated later
  const serverHostname = import.meta.server ? useRequestURL().hostname : undefined;

  const isStaging = computed<boolean>(() => {
    if (isDev)
      return true;

    // On the server, do NOT treat localhost as staging because behind proxies
    // the SSR hostname can be "localhost" even for production requests.
    if (import.meta.server)
      return serverHostname === STAGING_HOSTNAME;

    // On the client, allow localhost only for development; otherwise
    // only staging.rotki.com should enable staging branding.
    const hostname = window.location.hostname;
    return hostname === STAGING_HOSTNAME || (isDev && hostname === LOCALHOST);
  });

  useHead(() => {
    if (!get(isStaging))
      return {};

    return {
      link: [
        { href: '/staging/apple-touch-icon.png', rel: 'apple-touch-icon', sizes: '180x180' },
        { href: '/staging/favicon.ico', rel: 'icon', type: 'image/x-icon' },
        { href: '/staging/favicon-32x32.png', rel: 'icon', sizes: '32x32', type: 'image/png' },
        { href: '/staging/favicon-16x16.png', rel: 'icon', sizes: '16x16', type: 'image/png' },
        { href: '/staging/site.webmanifest', rel: 'manifest', crossorigin: 'use-credentials' },
        { href: '/staging/safari-pinned-tab.svg', rel: 'mask-icon', color: '#5bbad5' },
      ],
    };
  });

  return {
    isStaging: readonly(isStaging),
  };
});

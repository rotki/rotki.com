import type { Ref } from 'vue';
import { createSharedComposable } from '@vueuse/core';
import { get } from '@vueuse/shared';

const STAGING_HOSTNAME = 'staging.rotki.com';
const LOCALHOST = 'localhost';

interface UseStagingBrandingReturn { isStaging: Readonly<Ref<boolean>> }

export const useStagingBranding = createSharedComposable((): UseStagingBrandingReturn => {
  const { isDev, baseUrl } = useRuntimeConfig().public;

  // Use NUXT_PUBLIC_BASE_URL for consistent hostname detection across SSR/prerender/client
  const configHostname = baseUrl ? new URL(baseUrl).hostname : undefined;

  const isStaging = computed<boolean>(() => {
    if (isDev)
      return true;

    // Use the configured base URL hostname for SSR and prerender
    if (import.meta.server)
      return configHostname === STAGING_HOSTNAME;

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

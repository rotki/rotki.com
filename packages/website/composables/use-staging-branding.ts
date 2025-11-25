import { get } from '@vueuse/shared';

const STAGING_HOSTNAME = 'staging.rotki.com';
const LOCALHOST = 'localhost';

export function useStagingBranding(): { isStaging: Readonly<Ref<boolean>> } {
  const { isDev } = useRuntimeConfig().public;

  // Get the request URL at setup time (when Nuxt instance is available)
  // to avoid "[nuxt] instance unavailable" errors when computed is evaluated later
  const serverHostname = import.meta.server ? useRequestURL().hostname : undefined;

  const isStaging = computed<boolean>(() => {
    if (isDev)
      return true;

    if (import.meta.server)
      return serverHostname === STAGING_HOSTNAME || serverHostname === LOCALHOST;

    return window.location.hostname === STAGING_HOSTNAME || window.location.hostname === LOCALHOST;
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
}

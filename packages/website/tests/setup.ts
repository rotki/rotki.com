import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { createFetch } from 'ofetch';
import { afterAll, afterEach, vi } from 'vitest';
import { server } from '~~/tests/mocks/server';

mockNuxtImport('useRuntimeConfig', () => () => {
  const { BACKEND_URL } = import.meta.env;
  return {
    app: {
      baseURL: '/',
      buildId: 'test',
    },
    public: {
      backendUrl: BACKEND_URL,
      baseUrl: BACKEND_URL,
      contact: {
        discord: 'https://discord.rotki.com',
        email: 'info@rotki.com',
        emailMailto: 'mailto:info@rotki.com',
        github: 'https://github.com/rotki',
        reddit: 'https://www.reddit.com/r/rotki',
        twitter: 'https://twitter.com/rotkiapp',
      },
      i18n: {
        defaultLocale: 'en',
        detectBrowserLanguage: false,
      },
    },
  };
});

// Start MSW before Nuxt environment initialization (which runs in beforeAll with @nuxt/test-utils v4)
server.listen({ onUnhandledRequest: `error` });

// Nuxt's auto-imported $fetch uses an internal fetch reference that MSW cannot intercept
// in Vitest v4's Module Runner context. Replace it with a fresh ofetch instance that uses
// the MSW-patched globalThis.fetch. See: https://github.com/nuxt/test-utils/issues/775
// `vi.stubGlobal`'s value is typed `unknown`, so this avoids casting ofetch's
// `$Fetch` to Nuxt's route-typed `$Fetch` (which aren't assignable).
vi.stubGlobal('$fetch', createFetch());

afterAll(() => server.close());

afterEach(() => server.resetHandlers());

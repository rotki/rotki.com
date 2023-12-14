import { afterAll, afterEach, beforeAll } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { server } from '~/tests/mocks/server';

mockNuxtImport('useRuntimeConfig', () => () => {
  const { BACKEND_URL } = import.meta.env;
  return {
    public: {
      baseUrl: BACKEND_URL,
      backendUrl: BACKEND_URL,
      contact: {
        emailMailto: 'mailto:info@rotki.com',
        email: 'info@rotki.com',
        twitter: 'https://twitter.com/rotkiapp',
        discord: 'https://discord.rotki.com',
        github: 'https://github.com/rotki',
      },
    },
    app: { baseURL: '/' },
  };
});

beforeAll(() => server.listen({ onUnhandledRequest: `error` }));

afterAll(() => server.close());

afterEach(() => server.resetHandlers());

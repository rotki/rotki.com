import { afterAll, afterEach, beforeAll } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { server } from '~/tests/mocks/server';

mockNuxtImport('useRuntimeConfig', () => () => {
  const { BACKEND_URL } = import.meta.env;
  return {
    app: { baseURL: '/' },
    public: {
      backendUrl: BACKEND_URL,
      baseUrl: BACKEND_URL,
      contact: {
        discord: 'https://discord.rotki.com',
        email: 'info@rotki.com',
        emailMailto: 'mailto:info@rotki.com',
        github: 'https://github.com/rotki',
        twitter: 'https://twitter.com/rotkiapp',
      },
    },
  };
});

beforeAll(() => server.listen({ onUnhandledRequest: `error` }));

afterAll(() => server.close());

afterEach(() => server.resetHandlers());

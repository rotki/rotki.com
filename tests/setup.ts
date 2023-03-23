import { afterAll, afterEach, beforeAll } from 'vitest';
import { mockNuxtImport } from 'nuxt-vitest/utils';
import { server } from '~/tests/mocks/server';

const { BACKEND_URL } = import.meta.env;

mockNuxtImport('useRuntimeConfig', () => () => ({
  public: { baseUrl: BACKEND_URL, backendUrl: BACKEND_URL },
  app: { baseURL: '/' },
}));

beforeAll(() => server.listen({ onUnhandledRequest: `error` }));

afterAll(() => server.close());

afterEach(() => server.resetHandlers());

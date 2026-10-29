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

/* The nuxt environment with happy-dom leaves `Request` as happy-dom's class while `Headers` and
   `AbortController` stay Node's, and its fetch hands absolute URLs to Node's fetch. MSW 3 always
   calls that fetch, so line the classes up before MSW patches it. */
const environmentFetch = globalThis.fetch;

/** Rebuilds a happy-dom `Request` as a URL and init that Node's fetch accepts. */
async function toNodeFetchArgs(request: Request): Promise<[string, RequestInit]> {
  const controller = new AbortController();
  if (request.signal.aborted)
    controller.abort(request.signal.reason);
  else
    request.signal.addEventListener('abort', () => controller.abort(request.signal.reason), { once: true });

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  return [request.url, {
    body: hasBody ? await request.arrayBuffer() : undefined,
    credentials: request.credentials,
    headers: [...request.headers.entries()],
    method: request.method,
    redirect: request.redirect,
    signal: controller.signal,
  }];
}

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof input === 'string' || input instanceof URL)
    return environmentFetch(input, init);
  const [url, requestInit] = await toNodeFetchArgs(input);
  return environmentFetch(url, { ...requestInit, ...init });
};

// A happy-dom `Request` reads a Node `Headers` as empty, which dropped every header MSW handlers saw.
vi.stubGlobal('Headers', new Request('http://localhost/').headers.constructor);

// Start MSW before Nuxt environment initialization (which runs in beforeAll with @nuxt/test-utils v4)
server.listen({ onUnhandledFrame: `error` });

/* Nuxt's auto-imported $fetch uses an internal fetch reference that MSW cannot intercept
   in Vitest v4's Module Runner context. Replace it with a fresh ofetch instance that uses
   the MSW-patched globalThis.fetch. See: https://github.com/nuxt/test-utils/issues/775
   `vi.stubGlobal`'s value is typed `unknown`, so this avoids casting ofetch's
   `$Fetch` to Nuxt's route-typed `$Fetch` (which aren't assignable). */
vi.stubGlobal('$fetch', createFetch());

afterAll(() => server.close());

afterEach(() => server.resetHandlers());

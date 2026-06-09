import type { Account } from '@rotki/card-payment-common/schemas/account';
import type { ApiResponse } from '@rotki/card-payment-common/schemas/api';
import type { Country } from '~/composables/use-countries';
import type { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { retryAttempts } from '../../mocks/handlers';

// Provide a stable CSRF token cookie so outgoing requests carry a token, which
// is required to exercise the retry header-dedup path.
mockNuxtImport('useCookie', () => (name: string) =>
  ref(name === 'csrftoken' ? '1234' : undefined));

// In the server/test code path the token is read from the request event's
// cookies (a runtime global, not an auto-import); return the token here so
// request headers carry it.
vi.stubGlobal('parseCookies', () => ({ csrftoken: '1234' }));

const logout = vi.fn();
const refresh = vi.fn();

let fetchWithCsrf: ReturnType<typeof useFetchWithCsrf>['fetchWithCsrf'];

describe('useFetchWithCsrf composable', () => {
  beforeAll(async () => {
    const { useFetchWithCsrf } = await import('~/composables/use-fetch-with-csrf');
    const result = useFetchWithCsrf();
    fetchWithCsrf = result.fetchWithCsrf;
    result.setHooks({ logout, refresh });
  });

  afterEach(() => {
    logout.mockReset();
    refresh.mockReset();
  });

  it('fetchWithCsrf: fetch countries runs correctly', async () => {
    await expect(
      fetchWithCsrf<ApiResponse<Country[]>>(`/webapi/countries/`),
    ).resolves.toMatchObject(
      expect.objectContaining({
        result: [{ code: 'CT', name: 'Country' }],
      }),
    );

    expect(refresh).toBeCalled();
    expect(refresh).toHaveBeenCalledOnce();
  }, 5000);

  it('fetchWithCsrf: fetch account info with 401 error', async () => {
    mockNuxtImport('navigateTo', () => vi.fn());
    await expect(
      fetchWithCsrf<ApiResponse<Account>>(`/webapi/account/`),
    ).rejects.toThrowError(/401/);
    expect(logout).toBeCalled();
    expect(logout).toHaveBeenCalledOnce();
    expect(navigateTo).toHaveBeenCalledOnce();
  }, 2000);

  it('initCsrf: login and setup csrf successfully', async () => {
    await expect(
      fetchWithCsrf<ApiResponse<undefined>>(`/webapi/login/`, {
        body: {
          password: '1234',
          username: 'test',
        },
        method: 'POST',
      }),
    ).resolves.toMatchObject({ message: 'success' });
  }, 2000);

  it('fetchWithCsrf: does not duplicate the CSRF header across retries', async () => {
    retryAttempts.count = 0;

    // MSW + undici drops headers when reading them off the intercepted request
    // (mswjs/headers-polyfill#72), so assert against the headers the composable
    // builds. The per-call response hooks run after the instance onRequest (which
    // sets the CSRF header): the failed first attempt hits onResponseError, the
    // retried success hits onResponse — both see the fully-built options.headers.
    const csrfHeaders: (string | null)[] = [];
    const capture = ({ options }: { options: { headers?: HeadersInit } }): void => {
      csrfHeaders.push(new Headers(options.headers).get('X-CSRFToken'));
    };

    await expect(
      fetchWithCsrf<ApiResponse<undefined>>(`/webapi/retry/`, {
        body: { foo: 'bar' },
        method: 'POST',
        onResponse: capture,
        onResponseError: capture,
      }),
    ).resolves.toMatchObject({ message: 'success' });

    // The first attempt fails with 503 and is retried, so the request is sent
    // twice over the same (reused) options object.
    expect(retryAttempts.count).toBe(2);
    expect(csrfHeaders.length).toBeGreaterThanOrEqual(2);
    // Every attempt must carry a single, un-duplicated CSRF token — not
    // "1234, 1234" caused by appending the header on retry.
    for (const header of csrfHeaders) {
      expect(header).toBe('1234');
    }
  }, 5000);
});

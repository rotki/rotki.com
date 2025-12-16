import type { Account } from '@rotki/card-payment-common/schemas/account';
import type { ApiResponse } from '@rotki/card-payment-common/schemas/api';
import type { Country } from '~/composables/use-countries';
import type { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

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
});

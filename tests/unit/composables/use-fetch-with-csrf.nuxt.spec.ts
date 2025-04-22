import type { Country } from '~/composables/countries';
import type { ApiResponse } from '~/types';
import type { Account } from '~/types/account';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';

const logout = vi.fn();
const refresh = vi.fn();

const { fetchWithCsrf, setHooks } = useFetchWithCsrf();
setHooks({ logout, refresh });

describe('useFetchWithCsrf composable', () => {
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

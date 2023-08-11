import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Account, ApiResponse } from '~/types';
import { fetchWithCsrf, setHooks, sleep } from '~/utils/api';
import { type Country } from '~/composables/countries';

const logout = vi.fn();
const refresh = vi.fn();
setHooks({ logout, refresh });

describe('api utilities', () => {
  afterEach(() => {
    logout.mockReset();
    refresh.mockReset();
  });

  it('fetchWithCsrf: fetch countries runs correctly', async () => {
    await expect(
      fetchWithCsrf<ApiResponse<Country[]>>(`/webapi/countries`),
    ).resolves.toMatchObject(
      expect.objectContaining({
        result: [{ name: 'Country', code: 'CT' }],
      }),
    );

    expect(refresh).toBeCalled();
    expect(refresh).toHaveBeenCalledOnce();
  }, 5000);

  it('fetchWithCsrf: fetch account info with 401 error', async () => {
    await expect(
      fetchWithCsrf<ApiResponse<Account>>(`/webapi/account`),
    ).rejects.toMatch(/401/);
    expect(logout).toBeCalled();
    expect(logout).toHaveBeenCalledOnce();
  }, 2000);

  it('initCsrf: login and setup csrf successfully', async () => {
    await expect(
      fetchWithCsrf<ApiResponse<undefined>>(`/webapi/login/`, {
        method: 'post',
        body: {
          username: 'test',
          password: '1234',
        },
      }),
    ).resolves.toMatchObject({ message: 'success' });
  }, 2000);

  it('sleep: resolves with the exact timeout', async () => {
    const controller = new AbortController();
    await expect(sleep(1, controller.signal)).resolves.toBeUndefined();
  }, 1000);

  it('sleep: early abort throws an error', async () => {
    const controller = new AbortController();

    setTimeout(() => controller.abort(), 1);
    await expect(sleep(2000, controller.signal)).rejects.toMatch(
      /request aborted/,
    );
  });
});

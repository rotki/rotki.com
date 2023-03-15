import { afterEach, assert, describe, expect, it, vi } from 'vitest';
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
    const response = await fetchWithCsrf<ApiResponse<Country[]>>(
      `/webapi/countries`
    );

    assert.isArray(response.result);
    assert.equal(response.result?.length, 249);
    expect(refresh).toBeCalled();
    expect(refresh).toHaveBeenCalledOnce();
  }, 5000);

  it('fetchWithCsrf: fetch account info with 401 error', () => {
    const response = fetchWithCsrf<ApiResponse<Account>>(`/webapi/account`);

    response.catch((e) => {
      assert.equal(e.status, 401);
      expect(logout).toBeCalled();
      expect(logout).toHaveBeenCalledOnce();
    });
  }, 2000);

  it.skip('initCsrf: login and setup csrf successfully', async () => {
    const response = await fetchWithCsrf<ApiResponse<undefined>>(
      `/webapi/login/`,
      {
        method: 'post',
        body: {
          username: '',
          password: '',
        },
      }
    );

    assert.isString(response.message);
    assert.isUndefined(response.result);
  }, 2000);

  it('sleep: resolves with the exact timeout', async () => {
    const controller = new AbortController();
    const res = await sleep(1000, controller.signal);

    assert.equal(res, undefined);
  }, 1000);

  it('sleep: early abort throws an error', () => {
    const controller = new AbortController();
    const aborter = sleep(2000, controller.signal);

    controller.abort();

    aborter.catch((e) => {
      assert.equal(e.message, 'request aborted');
    });
  });
});

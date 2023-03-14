import { assert, describe, it } from 'vitest';
import { fetchWithCsrf, sleep } from '~/utils/api';
import { type ApiResponse } from '~/types';
import { type Country } from '~/composables/countries';

const { BASE_URL } = import.meta.env;
describe('api utilities', () => {
  it('fetchWithCsrf: fetch countries runs correctly', async () => {
    const response = await fetchWithCsrf<ApiResponse<Country[]>>(
      `${BASE_URL}/countries`
    );

    assert.isArray(response.result);
  }, 5000);

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

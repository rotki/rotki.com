import { assert, describe, it } from 'vitest';
import { sleep } from '~/utils/api';

const { BASE_URL } = import.meta.env;
describe('api utilities', () => {
  it('fetchWithCsrf: fetch countries runs correctly', async () => {
    // todo: revert this to fetchWithCsrf
    const response = await fetch(`${BASE_URL}/countries`);

    assert.isTrue(response.ok);
    assert.equal(response.status, 200);

    const json = await response.json();

    assert.isArray(json.result);
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

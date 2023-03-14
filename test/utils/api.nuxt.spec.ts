import { assert, describe, it } from 'vitest';
import { fetchWithCsrf } from '~/utils/api';

describe('test fetchWithCsrf', () => {
  it('fetches countries runs correctly', async () => {
    const response = await fetchWithCsrf('https://rotki.com/webapi/countries');

    assert.isArray(response.result);
  }, 5000);
});

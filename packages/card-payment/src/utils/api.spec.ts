import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCSRFToken } from './api';

function clearCookie(): void {
  document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

describe('utils/api fetchCSRFToken', () => {
  beforeEach(() => {
    clearCookie();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearCookie();
  });

  it('reuses the cookie rotki.com already set, without a request', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    document.cookie = 'csrftoken=from-site';

    await expect(fetchCSRFToken()).resolves.toBe('from-site');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('asks the backend once for requests that start together', async () => {
    const fetch = vi.fn(async () => {
      document.cookie = 'csrftoken=fresh';
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal('fetch', fetch);

    await expect(Promise.all([fetchCSRFToken(), fetchCSRFToken(), fetchCSRFToken()])).resolves.toEqual(['fresh', 'fresh', 'fresh']);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('fails when the backend sets no cookie, and asks again next time', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);

    await expect(fetchCSRFToken()).rejects.toThrow('CSRF token not found in cookies');
    await expect(fetchCSRFToken()).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

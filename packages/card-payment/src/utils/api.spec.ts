import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCSRFToken, getAccount, getActiveCampaign, getAvailablePlans, getPaymentBreakdown } from './api';

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

/** Answers every request with `body`, with the CSRF cookie already set as on a signed-in visit. */
function respondWith(status: number, body: unknown): ReturnType<typeof vi.fn> {
  document.cookie = 'csrftoken=from-site';
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

const breakdown = {
  braintree_client_token: 'client-token',
  discount: null,
  final_amount: '25.00',
  full_amount: '25.00',
  next_payment: 0,
  renewing_price: '25.00',
  vat_amount: '3.99',
  vat_rate: '0.1900',
};

describe('utils/api requests', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearCookie();
  });

  it('asks for the breakdown in snake case with the CSRF token, and reads it in camel case', async () => {
    const fetch = respondWith(200, breakdown);

    await expect(getPaymentBreakdown({ newPlanId: 3, isCryptoPayment: false, discountCode: 'SUMMER' })).resolves.toMatchObject({ braintreeClientToken: 'client-token', finalAmount: '25.00' });
    const [, init] = fetch.mock.calls[0] ?? [];
    expect(JSON.parse(String(init?.body))).toEqual({ new_plan_id: 3, is_crypto_payment: false, discount_code: 'SUMMER' });
    expect(new Headers(init?.headers).get('X-CSRFToken')).toBe('from-site');
  });

  it.each([
    ['an error status', 500, breakdown],
    ['an unknown shape', 200, { final_amount: 25 }],
  ])('has no breakdown for %s', async (_, status, body) => {
    respondWith(status, body);

    await expect(getPaymentBreakdown({ newPlanId: 3, isCryptoPayment: false })).resolves.toBeNull();
  });

  it('reads the available plans, and none on an error', async () => {
    respondWith(200, { settings: { country: 'DE', is_authenticated: true }, tiers: [{ tier_name: 'basic', monthly_plan: { plan_id: 3, price: '25.00' }, yearly_plan: { plan_id: 4, price: '250.00' } }] });
    await expect(getAvailablePlans()).resolves.toMatchObject({ tiers: [{ tierName: 'basic' }] });

    respondWith(503, {});
    await expect(getAvailablePlans()).resolves.toBeNull();
  });

  it('has no account for a visitor who is not signed in', async () => {
    respondWith(401, { message: 'Unauthorized' });

    await expect(getAccount()).resolves.toBeUndefined();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('reads the running campaign, and treats a failure as none', async () => {
    respondWith(200, { active_campaign: { code: 'AUTUMN', percent: 20 } });
    await expect(getActiveCampaign()).resolves.toEqual({ code: 'AUTUMN', percent: 20 });

    respondWith(500, {});
    await expect(getActiveCampaign()).resolves.toBeUndefined();
  });
});

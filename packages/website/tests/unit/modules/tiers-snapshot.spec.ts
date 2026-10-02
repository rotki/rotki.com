import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEV_CACHE_MAX_AGE_MS, fetchTiersSnapshot, loadTiersSnapshot, snapshotSource } from '../../../modules/tiers-snapshot/module';

const availablePlans = {
  settings: { is_authenticated: false, country: null },
  tiers: [{ tier_name: 'Basic', monthly_plan: { plan_id: 3, price: '25.00' }, yearly_plan: { plan_id: 4, price: '250.00' } }],
};

const tiersInfo = [{
  name: 'Basic',
  monthly_plan: { price: '25.00', id: 3 },
  yearly_plan: { price: '250.00', id: 4 },
  limits: { history_events_limit: 30000 },
  description: [],
}];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

/** A fetch that answers each endpoint with the given bodies. */
function fakeFetch(plans: unknown, info: unknown) {
  return vi.fn<typeof fetch>(async input => (String(input).endsWith('/available-tiers') ? json(plans) : json(info)));
}

/** A fetch for an API that is down. */
function failingFetch() {
  return vi.fn<typeof fetch>(async () => json({ detail: 'down' }, 503));
}

describe('snapshotSource', () => {
  it('reads production for a site built for rotki.com', () => {
    expect(snapshotSource('https://rotki.com', undefined)).toBe('https://rotki.com');
    expect(snapshotSource('https://www.rotki.com/', undefined)).toBe('https://rotki.com');
  });

  it('reads staging for staging, local development and CI', () => {
    expect(snapshotSource('https://staging.rotki.com', undefined)).toBe('https://staging.rotki.com');
    expect(snapshotSource('http://localhost:48123', undefined)).toBe('https://staging.rotki.com');
    expect(snapshotSource(undefined, undefined)).toBe('https://staging.rotki.com');
  });

  it('prefers an explicit origin, without its trailing slash', () => {
    expect(snapshotSource('https://rotki.com', 'http://localhost:9999/')).toBe('http://localhost:9999');
  });
});

describe('fetchTiersSnapshot', () => {
  it('returns both responses from the source, keys converted as the app expects', async () => {
    const fetchImpl = fakeFetch(availablePlans, tiersInfo);

    const snapshot = await fetchTiersSnapshot('https://staging.rotki.com', fetchImpl);

    expect(snapshot.source).toBe('https://staging.rotki.com');
    expect(snapshot.availablePlans).toMatchObject({ tiers: [{ tierName: 'Basic', monthlyPlan: { planId: 3, price: '25.00' } }] });
    expect(snapshot.tiersInfo).toMatchObject([{ name: 'Basic', limits: { historyEventsLimit: 30000 } }]);
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      'https://staging.rotki.com/webapi/2/available-tiers',
      'https://staging.rotki.com/webapi/2/tiers/info',
    ]);
  });

  it('fails when the API answers with no plans', async () => {
    await expect(fetchTiersSnapshot('https://rotki.com', fakeFetch({ ...availablePlans, tiers: [] }, tiersInfo)))
      .rejects
      .toThrow('https://rotki.com/webapi/2/available-tiers returned no valid plans');
  });

  it('fails when the tier details do not match the schema', async () => {
    await expect(fetchTiersSnapshot('https://rotki.com', fakeFetch(availablePlans, [{ name: 'Basic' }])))
      .rejects
      .toThrow('https://rotki.com/webapi/2/tiers/info returned no valid tiers');
  });

  it('retries a failing request, then fails with its error', async () => {
    const fetchImpl = failingFetch();

    await expect(fetchTiersSnapshot('https://rotki.com', fetchImpl, 0))
      .rejects
      .toThrow('https://rotki.com/webapi/2/available-tiers: HTTP 503');

    // Three attempts at the endpoint that failed; the other one may still be retrying
    expect(fetchImpl.mock.calls.filter(([url]) => String(url).endsWith('/available-tiers'))).toHaveLength(3);
  });

  it('recovers when a retry succeeds', async () => {
    let failures = 1;
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      if (String(input).endsWith('/available-tiers') && failures-- > 0)
        throw new TypeError('fetch failed');
      return String(input).endsWith('/available-tiers') ? json(availablePlans) : json(tiersInfo);
    });

    await expect(fetchTiersSnapshot('https://rotki.com', fetchImpl, 0)).resolves.toMatchObject({ source: 'https://rotki.com' });
  });
});

describe('loadTiersSnapshot', () => {
  const NOW = 1_800_000_000_000;
  const source = 'https://staging.rotki.com';
  let dir: string;
  let cacheFile: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tiers-snapshot-'));
    cacheFile = join(dir, 'staging.rotki.com.json');
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  async function cacheFetchedAt(fetchedAt: number): Promise<void> {
    const snapshot = { source, availablePlans: { cached: true }, tiersInfo: [] };
    await writeFile(cacheFile, JSON.stringify({ fetchedAt, snapshot }));
  }

  it('always fetches for a build, even with a fresh cache, and fails without an answer', async () => {
    await cacheFetchedAt(NOW);
    const fetchImpl = failingFetch();

    await expect(loadTiersSnapshot({ source, dev: false, cacheFile, now: NOW, fetchImpl, retryDelayMs: 0 }))
      .rejects
      .toThrow('HTTP 503');
    expect(fetchImpl).toHaveBeenCalled();
  });

  it('lets the dev server reuse a snapshot younger than a day without a request', async () => {
    await cacheFetchedAt(NOW - DEV_CACHE_MAX_AGE_MS + 60_000);
    const fetchImpl = fakeFetch(availablePlans, tiersInfo);

    const snapshot = await loadTiersSnapshot({ source, dev: true, cacheFile, now: NOW, fetchImpl });

    expect(snapshot.availablePlans).toEqual({ cached: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('refreshes an expired dev snapshot and stores the new one', async () => {
    await cacheFetchedAt(NOW - DEV_CACHE_MAX_AGE_MS - 1);

    const snapshot = await loadTiersSnapshot({ source, dev: true, cacheFile, now: NOW, fetchImpl: fakeFetch(availablePlans, tiersInfo) });

    expect(snapshot.availablePlans).toMatchObject({ tiers: [{ tierName: 'Basic' }] });
    expect(JSON.parse(await readFile(cacheFile, 'utf-8'))).toMatchObject({ fetchedAt: NOW });
  });

  it('keeps an expired dev snapshot when the API does not answer', async () => {
    await cacheFetchedAt(NOW - 3 * DEV_CACHE_MAX_AGE_MS);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const snapshot = await loadTiersSnapshot({ source, dev: true, cacheFile, now: NOW, fetchImpl: failingFetch(), retryDelayMs: 0 });

    expect(snapshot.availablePlans).toEqual({ cached: true });
  });

  it('fails the dev server when there is no snapshot and no answer', async () => {
    await expect(loadTiersSnapshot({ source, dev: true, cacheFile, now: NOW, fetchImpl: failingFetch(), retryDelayMs: 0 }))
      .rejects
      .toThrow('HTTP 503');
  });
});

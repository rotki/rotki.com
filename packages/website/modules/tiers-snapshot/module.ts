import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { addTypeTemplate, addVitePlugin, defineNuxtModule } from '@nuxt/kit';
import { AvailablePlansResponseSchema } from '@rotki/card-payment-common/schemas/plans';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { PremiumTiersInfo } from '../../app/types/tiers';

const VIRTUAL_ID = 'virtual:tiers-snapshot';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

const PRODUCTION_SOURCE = 'https://rotki.com';
const STAGING_SOURCE = 'https://staging.rotki.com';
const PRODUCTION_HOSTS: readonly string[] = ['rotki.com', 'www.rotki.com'];

const ATTEMPTS = 3;
const TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 2_000;

/** How long the dev server reuses the plans it fetched; a build always fetches fresh ones. */
export const DEV_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** The plans API responses, with camelCase keys as the app's schemas expect. */
export interface TiersSnapshot {
  /** Origin the responses came from, e.g. `https://rotki.com`; empty when nothing was fetched. */
  source: string;
  /** Body of `/webapi/2/available-tiers`. */
  availablePlans: unknown;
  /** Body of `/webapi/2/tiers/info`. */
  tiersInfo: unknown;
}

interface CachedSnapshot {
  fetchedAt: number;
  snapshot: TiersSnapshot;
}

/** What `prepare` and unit tests get: they never render a page, so they need no network. */
const EMPTY_SNAPSHOT: TiersSnapshot = {
  source: '',
  availablePlans: { settings: { isAuthenticated: false }, tiers: [] },
  tiersInfo: [],
};

/**
 * Picks the API the build reads plans from. A production build (base URL on rotki.com) reads
 * production; staging, development and CI read staging. Plan ids differ between the two, so a
 * build must never carry the other environment's plans.
 *
 * @param baseUrl - `NUXT_PUBLIC_BASE_URL`, the URL the site is built for
 * @param override - `TIERS_SNAPSHOT_URL`, an explicit origin such as the e2e mock API
 */
export function snapshotSource(baseUrl: string | undefined, override: string | undefined): string {
  if (override)
    return override.replace(/\/+$/, '');

  if (!baseUrl)
    return STAGING_SOURCE;

  return PRODUCTION_HOSTS.includes(new URL(baseUrl).hostname) ? PRODUCTION_SOURCE : STAGING_SOURCE;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url: string, fetchImpl: typeof fetch, retryDelayMs: number): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const response = await fetchImpl(url, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok)
        throw new Error(`HTTP ${response.status}`);
      // The app converts every response the same way before its schemas read it
      return convertKeys(await response.json(), true, false);
    }
    catch (error) {
      lastError = error;
      if (attempt < ATTEMPTS)
        await delay(retryDelayMs);
    }
  }
  throw new Error(`${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

/**
 * Fetches the plans and tier details from `source` and checks them with the app's own schemas.
 *
 * @param source - the API origin, e.g. `https://rotki.com`
 * @param fetchImpl - the fetch to use; tests pass a fake
 * @param retryDelayMs - pause between attempts at a failing request
 * @throws when either request fails after retries, or answers with nothing usable
 */
export async function fetchTiersSnapshot(source: string, fetchImpl: typeof fetch = fetch, retryDelayMs = RETRY_DELAY_MS): Promise<TiersSnapshot> {
  const plansUrl = `${source}/webapi/2/available-tiers`;
  const infoUrl = `${source}/webapi/2/tiers/info`;
  const [availablePlans, tiersInfo] = await Promise.all([
    fetchJson(plansUrl, fetchImpl, retryDelayMs),
    fetchJson(infoUrl, fetchImpl, retryDelayMs),
  ]);

  const plans = AvailablePlansResponseSchema.safeParse(availablePlans);
  if (!plans.success || plans.data.tiers.length === 0)
    throw new Error(`${plansUrl} returned no valid plans`);

  const info = PremiumTiersInfo.safeParse(tiersInfo);
  if (!info.success || info.data.length === 0)
    throw new Error(`${infoUrl} returned no valid tiers`);

  return { source, availablePlans, tiersInfo };
}

async function readCache(file: string): Promise<CachedSnapshot | undefined> {
  try {
    const cached: CachedSnapshot = JSON.parse(await readFile(file, 'utf-8'));
    return typeof cached.fetchedAt === 'number' && cached.snapshot ? cached : undefined;
  }
  catch {
    return undefined;
  }
}

async function writeCache(file: string, cached: CachedSnapshot): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(cached));
}

interface LoadOptions {
  source: string;
  /** The dev server reuses a recent snapshot; a build always fetches. */
  dev: boolean;
  /** Where the last fetched snapshot for this source is kept. */
  cacheFile: string;
  now?: number;
  fetchImpl?: typeof fetch;
  retryDelayMs?: number;
}

/**
 * Loads the snapshot for a build or the dev server without asking the API more than needed.
 *
 * - A build always fetches, and fails when the API does not answer.
 * - The dev server reuses its last snapshot for a day. When that has expired and the API does
 *   not answer, it keeps the old one with a warning, and fails only when it has none.
 */
export async function loadTiersSnapshot({ source, dev, cacheFile, now = Date.now(), fetchImpl = fetch, retryDelayMs }: LoadOptions): Promise<TiersSnapshot> {
  const cached = dev ? await readCache(cacheFile) : undefined;
  if (cached && now - cached.fetchedAt < DEV_CACHE_MAX_AGE_MS)
    return cached.snapshot;

  try {
    const snapshot = await fetchTiersSnapshot(source, fetchImpl, retryDelayMs);
    await writeCache(cacheFile, { fetchedAt: now, snapshot });
    return snapshot;
  }
  catch (error) {
    if (!cached)
      throw error;

    console.warn(`[tiers-snapshot] Using plans fetched ${new Date(cached.fetchedAt).toISOString()}: ${error instanceof Error ? error.message : String(error)}`);
    return cached.snapshot;
  }
}

export default defineNuxtModule({
  meta: { name: 'tiers-snapshot' },
  /**
   * Reads the plans and tier details when the site is built, so prerendered pages carry real
   * prices, plan ids and limits; the browser still loads the live values afterwards. A build
   * fails when the API does not answer. `prepare` (run on every install) and unit tests skip the
   * request, and the dev server reuses its last answer for a day.
   */
  async setup(_options, nuxt) {
    let snapshot = EMPTY_SNAPSHOT;
    // `nuxt.options.test` is also on for the e2e dev server (`TEST=true`), which should read its mock API
    if (!nuxt.options._prepare && !process.env.VITEST) {
      const source = snapshotSource(process.env.NUXT_PUBLIC_BASE_URL, process.env.TIERS_SNAPSHOT_URL);
      const cacheFile = resolve(nuxt.options.rootDir, 'node_modules/.cache/tiers-snapshot', `${new URL(source).host.replace(/[^\w.-]/g, '_')}.json`);
      try {
        snapshot = await loadTiersSnapshot({ source, dev: nuxt.options.dev, cacheFile });
        console.warn(`[tiers-snapshot] Building with the plans from ${source}`);
      }
      catch (error) {
        throw new Error(`[tiers-snapshot] Could not load the plans to build the site with: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    addVitePlugin({
      name: 'tiers-snapshot',
      resolveId: (id: string) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
      load: (id: string) => (id === RESOLVED_ID ? `export default ${JSON.stringify(snapshot)};` : undefined),
    });

    addTypeTemplate({
      filename: 'types/tiers-snapshot.d.ts',
      getContents: () => [
        `declare module '${VIRTUAL_ID}' {`,
        '  /** The plans API responses the site was built with, keys in camelCase; parse them with the app\'s schemas. */',
        '  const snapshot: { source: string; availablePlans: unknown; tiersInfo: unknown };',
        '  export default snapshot;',
        '}',
        '',
      ].join('\n'),
    });
  },
});

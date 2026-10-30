import process from 'node:process';
import { chromium, type FullConfig } from '@playwright/test';
import { nuxtPort } from './ports';

const nuxtDevUrl = `http://localhost:${nuxtPort}`;

/** Every page the specs open, so each one is compiled before a test waits on it. */
const ROUTES = [
  '/',
  '/activate/test-uid/test-token',
  '/checkout/pay/crypto',
  '/checkout/pay/method',
  '/checkout/pay/request-crypto?planId=3',
  '/download',
  '/home/subscription',
  '/login',
  '/signup',
];

/** Pages also loaded in a browser, which compiles the client modules the first test would wait on. */
const BROWSER_ROUTES = ['/checkout/pay/request-crypto?planId=3', '/'];

/** How long one attempt may take. A cold compile fits in it; a request that never gets an answer does not. */
const ATTEMPT_TIMEOUT_MS = 60_000;

const ATTEMPTS = 3;

function log(message: string): void {
  process.stdout.write(`[e2e warm-up] ${message}\n`);
}

/**
 * Runs `load` until one attempt finishes in time.
 *
 * @remarks
 * A young dev server sometimes leaves a request without an answer while the next one is served at
 * once, so an attempt that times out is retried instead of waited on.
 */
async function withAttempts(label: string, load: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const started = performance.now();
    try {
      await load();
      log(`${label} in ${Math.round(performance.now() - started)} ms`);
      return;
    }
    catch (error) {
      log(`${label} attempt ${attempt} failed after ${Math.round(performance.now() - started)} ms: ${String(error)}`);
    }
  }
}

async function fetchPage(route: string): Promise<void> {
  await withAttempts(route, async () => {
    const response = await fetch(`${nuxtDevUrl}${route}`, { signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) });
    await response.text();
  });
}

async function loadInBrowser(config: FullConfig): Promise<void> {
  const browser = await chromium.launch(config.projects[0]?.use.launchOptions);
  try {
    const page = await browser.newPage();
    for (const route of BROWSER_ROUTES) {
      await withAttempts(`${route} in a browser`, async () => {
        await page.goto(`${nuxtDevUrl}${route}`, { timeout: ATTEMPT_TIMEOUT_MS });
      });
    }
  }
  finally {
    await browser.close();
  }
}

/**
 * Compiles the pages on the Nuxt dev server before the first test.
 *
 * @remarks
 * Tests reach Nuxt through the Go server, which gives up on a response after 60 seconds. On CI the
 * first test's first request sometimes got no answer from the young dev server in that time, so the
 * test failed with an empty response and passed on retry. These requests go to Nuxt directly and
 * retry a request that hangs. Failures are only logged, since the tests report a broken server
 * better than this setup does.
 */
export default async function warmUp(config: FullConfig): Promise<void> {
  const started = performance.now();
  for (const route of ROUTES)
    await fetchPage(route);
  await loadInBrowser(config).catch((error: unknown) => {
    log(`browser failed to start: ${String(error)}`);
  });
  log(`done in ${Math.round(performance.now() - started)} ms`);
}

import type { Page } from '@playwright/test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL, URL } from 'node:url';
import { createCoverageMap } from '@vitest/istanbul-lib-coverage';
import convert from 'ast-v8-to-istanbul';

type ScriptCoverage = Awaited<ReturnType<Page['coverage']['stopJSCoverage']>>[number];

/** The repository root, which every path in the coverage reports is relative to. */
export const repositoryRoot = fileURLToPath(new URL('../../../../..', import.meta.url));

const appDirectory = fileURLToPath(new URL('../../../app/', import.meta.url));

/** Where the e2e lcov report is written. */
export const reportDirectory = fileURLToPath(new URL('../coverage/', import.meta.url));

/** Per-test coverage waiting to be merged; each worker writes its own files here. */
export const cacheDirectory = path.join(reportDirectory, '.cache');

/** Nuxt serves `app/` from here, one module per source file. */
const APP_PREFIX = '/_nuxt/';

/** Files outside `app/`, such as the workspace packages, are served by absolute path under here. */
const FILE_SYSTEM_PREFIX = '/_nuxt/@fs/';

/** How long a responsive page needs to hand over its coverage; well under the test timeout. */
const STOP_TIMEOUT_MS = 15_000;

/**
 * What the e2e report covers: the website app and the workspace packages it loads as source, limited
 * to the file types the unit coverage includes. Vite also serves imported stylesheets as JS modules,
 * and without the extension check those would show up as covered CSS.
 */
const COVERED_SOURCE = /^packages\/(?:website\/app\/.+\.(?:ts|vue)|(?:sigil|card-payment-common)\/src\/.+\.ts)$/;

/** Whether this run collects e2e coverage; set `E2E_COVERAGE=true` to turn it on. */
export function isCoverageEnabled(): boolean {
  return process.env.E2E_COVERAGE === 'true';
}

/**
 * Finds the file a dev server module was compiled from, or `undefined` for anything that is not one
 * of our sources.
 *
 * @remarks
 * The converter needs the real file location: it resolves the source map against it and reads the
 * file for ignore comments. Vite's client, virtual modules (`@id/`) and pre-bundled dependencies are
 * served from the same origin but have no file of ours behind them.
 */
function sourceFileOf(url: string): string | undefined {
  const { pathname } = new URL(url);
  if (pathname.includes('/node_modules/') || pathname.startsWith('/_nuxt/@id/') || pathname.startsWith('/_nuxt/@vite/'))
    return undefined;
  if (pathname.startsWith(FILE_SYSTEM_PREFIX))
    return decodeURIComponent(`/${pathname.slice(FILE_SYSTEM_PREFIX.length)}`);
  if (pathname.startsWith(APP_PREFIX))
    return path.join(appDirectory, decodeURIComponent(pathname.slice(APP_PREFIX.length)));
  return undefined;
}

function isCoveredSource(file: string): boolean {
  return COVERED_SOURCE.test(path.relative(repositoryRoot, file));
}

/**
 * Converts one module's V8 coverage to istanbul form on its original source files.
 *
 * @remarks
 * This is the conversion `@vitest/coverage-v8` runs for the unit tests, parser included, so both
 * reports describe the same client compilation the same way. The few places where the dev server's
 * own transforms still shift things are handled in `coverage-report.ts`. The parser comes from
 * `vitest/node`, which loads all of Vite, so it is only imported once there is coverage to convert.
 */
async function toIstanbul(script: ScriptCoverage, file: string): Promise<Awaited<ReturnType<typeof convert>>> {
  const { parseAstAsync } = await import('vitest/node');
  const code = script.source ?? '';
  return convert({
    ast: parseAstAsync(code),
    code,
    coverage: { functions: script.functions, url: pathToFileURL(file).href },
  });
}

/** Clears the report and cached coverage left over from an earlier run. */
export async function resetCoverage(): Promise<void> {
  await rm(reportDirectory, { force: true, recursive: true });
}

/** Starts collecting JS coverage for `page`, across the full page loads checkout does between routes. */
export async function startCoverage(page: Page): Promise<void> {
  await page.coverage.startJSCoverage({ resetOnNavigation: false });
}

/**
 * Stops collecting coverage for `page` and caches it under `id` for the final report.
 *
 * @remarks
 * `id` must be unique per test attempt, since workers run in parallel and a retry repeats a test.
 *
 * Stopping needs the page to answer, so a test that leaves its tab frozen (for example on a
 * navigation the server never responds to) would otherwise only fail on the teardown timeout, with
 * nothing pointing at the cause.
 */
export async function stopCoverage(page: Page, id: string): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const unresponsive = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Could not collect coverage: the page at ${page.url()} stopped responding`));
    }, STOP_TIMEOUT_MS);
  });
  const scripts = await Promise.race([page.coverage.stopJSCoverage(), unresponsive]).finally(() => {
    clearTimeout(timer);
  });
  const coverageMap = createCoverageMap();

  for (const script of scripts) {
    const file = sourceFileOf(script.url);
    if (file && isCoveredSource(file))
      coverageMap.merge(await toIstanbul(script, file));
  }
  coverageMap.filter(isCoveredSource);

  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(path.join(cacheDirectory, `${id}.json`), JSON.stringify(coverageMap.toJSON()));
}

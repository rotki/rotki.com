/**
 * Checks the JavaScript each prerendered page loads before it can hydrate.
 *
 * For every generated page it follows the entry script and modulepreload links
 * through the static `import` statements of the built chunks, reports the
 * gzipped total, and fails when:
 *
 * - a page reaches a chunk that only wallet or payment flows need,
 * - most pages load one of the ui-library's heavy form or table widgets, or
 * - one of the main public pages goes over its JavaScript budget or blocks its
 *   first paint on more than one stylesheet (`PAGE_BUDGETS_KB`).
 *
 * Why: these regressions are silent, the site just gets slower.
 * - The chunk layout in nuxt.config.ts depends on group order. When a heavy group
 *   claims a shared module (Vue, Vite's preload helper, `destr`), every page
 *   starts downloading the wallet SDKs.
 * - The ui-library declares its modules side-effect free (`sideEffects` in its
 *   package.json, since 2.27.0). If that ever regresses, its component barrel
 *   puts every component the site uses into one chunk that every page loads. A
 *   widget only a few pages render showing up on most pages is the sign of that.
 *
 * Usage:
 *   node scripts/check-initial-chunks.ts [distDir]
 *
 * Defaults: distDir=.output/public. Exits 1 on either failure.
 */

import { appendFileSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';

const DIST: string = process.argv.slice(2).find(a => !a.startsWith('--')) ?? '.output/public';

/** Chunk name prefixes (see `chunkGroups` in nuxt.config.ts) that no page may load up front. */
const HEAVY_CHUNKS: readonly string[] = [
  'viem',
  'wagmi',
  'walletconnect',
  'coinbase-wallet',
  'braintree-',
  'qrcode',
];

/** ui-library components only a handful of pages render. */
const HEAVY_UI_COMPONENTS: readonly string[] = [
  'RuiAutoComplete',
  'RuiDataTable',
  'RuiMenuSelect',
  'RuiTextArea',
];

/** A heavy ui-library component loaded by more than this share of pages fails the check. */
const MAX_UI_COMPONENT_PAGE_SHARE = 0.5;

/**
 * Initial JavaScript budgets (gzip KB) for the most visited public pages: their measured size plus
 * a little room. A page over budget usually imports a below-the-fold section eagerly; load it with
 * `defineLazyHydrationComponent` instead, or raise the budget in the same pull request and say why.
 */
const PAGE_BUDGETS_KB: Readonly<Record<string, number>> = {
  '/': 245,
  '/products': 245,
  '/pricing': 259,
  '/download': 280,
  '/integrations': 255,
  '/integrations/aave': 245,
  '/compare': 255,
  '/compare/koinly': 255,
  '/features': 255,
};

/**
 * Stylesheets those pages may block their first paint on. Each extra one costs a round trip before
 * anything shows; put component CSS in `app/assets/css/tailwind.css` instead.
 */
const MAX_BLOCKING_STYLESHEETS = 1;

const STATIC_IMPORT_RE = /(?:from|import)\s*"\.\/([^"]+\.js)"/g;
const COMPONENT_NAME_RE = /__name:`(Rui\w+)`/g;

interface PageReport {
  route: string;
  chunks: number;
  gzipBytes: number;
  stylesheets: number;
  heavy: string[];
  uiComponents: Set<string>;
}

interface ChunkInfo {
  imports: string[];
  components: string[];
  gzipBytes: number;
}

function routeFor(relFile: string): string {
  const posix = relFile.split(path.sep).join('/');
  const route = `/${posix.replace(/(?:index)?\.html$/, '').replace(/\/$/, '')}`;
  return route === '/' ? '/' : route;
}

function collectPages(distDir: string): string[] {
  return readdirSync(distDir, { recursive: true, encoding: 'utf8' })
    .filter(file => file.endsWith('.html'));
}

/** Script and modulepreload URLs under /_nuxt/ that the HTML asks for directly. */
function initialScripts(html: string): string[] {
  const files: string[] = [];
  for (const [tag, name] of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
    const isModuleScript = name!.toLowerCase() === 'script' && /\btype="module"/i.test(tag);
    const isModulePreload = name!.toLowerCase() === 'link' && /\brel="modulepreload"/i.test(tag);
    if (!isModuleScript && !isModulePreload)
      continue;
    const url = /\b(?:src|href)="\/_nuxt\/([^"?]+\.js)"/i.exec(tag)?.[1];
    if (url)
      files.push(url);
  }
  return files;
}

function createChunkReader(nuxtDir: string): (file: string) => ChunkInfo {
  const cache = new Map<string, ChunkInfo>();

  return (file: string): ChunkInfo => {
    let info = cache.get(file);
    if (!info) {
      const code = readFileSync(path.join(nuxtDir, file));
      const text = code.toString('utf8');
      info = {
        imports: Array.from(text.matchAll(STATIC_IMPORT_RE), m => m[1]!),
        components: Array.from(text.matchAll(COMPONENT_NAME_RE), m => m[1]!),
        gzipBytes: gzipSync(code).length,
      };
      cache.set(file, info);
    }
    return info;
  };
}

function closure(roots: string[], readChunk: (file: string) => ChunkInfo): Set<string> {
  const seen = new Set<string>();
  const queue = [...roots];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file))
      continue;
    seen.add(file);
    queue.push(...readChunk(file).imports);
  }
  return seen;
}

/** Appends the budget table to `lines` and returns the budgeted routes that fail. */
function checkBudgets(reports: PageReport[], lines: string[]): string[] {
  const failed: string[] = [];
  lines.push(
    '\n| Budgeted page | JS (gzip KB) | Budget | Blocking stylesheets |',
    '| --- | --- | --- | --- |',
  );
  for (const [route, budgetKb] of Object.entries(PAGE_BUDGETS_KB)) {
    const page = reports.find(r => r.route === route);
    const isOver = !page || page.gzipBytes / 1024 > budgetKb || page.stylesheets > MAX_BLOCKING_STYLESHEETS;
    if (isOver)
      failed.push(route);
    const js = page ? (page.gzipBytes / 1024).toFixed(1) : 'not generated';
    lines.push(`| ${isOver ? '🔴 ' : ''}\`${route}\` | ${js} | ${budgetKb} | ${page?.stylesheets ?? '-'} / ${MAX_BLOCKING_STYLESHEETS} |`);
  }
  return failed;
}

function main(): void {
  const readChunk = createChunkReader(path.join(DIST, '_nuxt'));

  const reports: PageReport[] = [];
  for (const page of collectPages(DIST)) {
    const html = readFileSync(path.join(DIST, page), 'utf8');
    const roots = initialScripts(html);
    if (roots.length === 0)
      continue;
    const chunks = [...closure(roots, readChunk)];
    reports.push({
      route: routeFor(page),
      chunks: chunks.length,
      gzipBytes: chunks.reduce((sum, file) => sum + readChunk(file).gzipBytes, 0),
      stylesheets: Array.from(html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/gi)).length,
      heavy: chunks.filter(file => HEAVY_CHUNKS.some(prefix => file.startsWith(prefix))),
      uiComponents: new Set(chunks.flatMap(file => readChunk(file).components)
        .filter(name => HEAVY_UI_COMPONENTS.includes(name))),
    });
  }

  reports.sort((a, b) => b.gzipBytes - a.gzipBytes);
  const failing = reports.filter(r => r.heavy.length > 0);
  const kb = (bytes: number): string => (bytes / 1024).toFixed(1);

  const uiComponentPages = HEAVY_UI_COMPONENTS.map(name => ({
    name,
    pages: reports.filter(r => r.uiComponents.has(name)).length,
  }));
  const leakedComponents = uiComponentPages.filter(c => c.pages > reports.length * MAX_UI_COMPONENT_PAGE_SHARE);

  const lines: string[] = [
    '## 📦 Initial JavaScript per page\n',
    `Checked **${reports.length}** pages · **${failing.length}** load wallet or payment chunks up front · `
    + `**${leakedComponents.length}** heavy ui-library component(s) load on most pages.\n`,
    '| Page | Chunks | JS (gzip KB) | Heavy chunks |',
    '| --- | --- | --- | --- |',
  ];
  const shown = [...failing, ...reports.filter(r => r.heavy.length === 0).slice(0, 10)];
  for (const r of shown) {
    const heavy = r.heavy.length > 0 ? `🔴 ${r.heavy.join(', ')}` : '';
    lines.push(`| \`${r.route}\` | ${r.chunks} | ${kb(r.gzipBytes)} | ${heavy} |`);
  }

  lines.push(
    '\n| ui-library component | Pages loading it up front |',
    '| --- | --- |',
  );
  for (const c of uiComponentPages) {
    const icon = leakedComponents.includes(c) ? '🔴 ' : '';
    lines.push(`| ${icon}\`${c.name}\` | ${c.pages} |`);
  }

  const overBudget = checkBudgets(reports, lines);

  const report = lines.join('\n');
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);

  const problems = failing.length + leakedComponents.length + overBudget.length;
  if (problems > 0)
    process.exit(1);
}

main();

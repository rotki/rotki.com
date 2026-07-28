#!/usr/bin/env node

/**
 * Guardrail for the static handler's hard-404 behaviour.
 *
 * The Go handler (backend/internal/server/static.go) serves the SPA shell only
 * for routes listed in `spa-routes.json` and hard-404s everything else. That
 * makes an un-prerendered route a user-visible 404 instead of a silent
 * client-side render, so every route the Vue router can reach must either be
 * built to disk or be covered by the manifest.
 *
 * This replicates the handler's resolution order against the build output, so
 * it needs no running server. Run after `pnpm generate`.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import consola from 'consola';

const PAGES_DIR = './packages/website/app/pages';
const OUTPUT_DIR = './packages/website/.output/public';
const MANIFEST = 'spa-routes.json';

// Values substituted for dynamic segments when probing for a bogus slug.
const BOGUS = 'zzz-definitely-not-a-real-slug';

/** app/pages/foo/[id].vue -> /foo/[id] */
function fileToRoute(relPath) {
  const withoutExt = relPath.slice(0, -'.vue'.length);
  let parts = withoutExt === 'index' ? [] : withoutExt.split(path.sep);
  if (parts.at(-1) === 'index')
    parts = parts.slice(0, -1);
  return `/${parts.join('/')}`;
}

function collectRoutes(dir, base = dir) {
  const routes = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory())
      routes.push(...collectRoutes(full, base));
    else if (entry.name.endsWith('.vue'))
      routes.push(fileToRoute(path.relative(base, full)));
  }
  return routes;
}

function matchesPattern(pattern, url) {
  if (pattern.endsWith('/**')) {
    const base = pattern.slice(0, -3);
    return url === base || url.startsWith(`${base}/`);
  }
  return url === pattern;
}

function manifestCovers(manifest, url) {
  return manifest.spaRoutes.some(p => matchesPattern(p, url))
    || (manifest.nestedApps ?? []).some(a => url === a.prefix || url.startsWith(`${a.prefix}/`));
}

/** Mirrors staticHandler.ServeHTTP: does this URL resolve to 200? */
function resolves(manifest, url) {
  const onDisk = path.join(OUTPUT_DIR, url);
  if (existsSync(onDisk)) {
    if (!statSync(onDisk).isDirectory())
      return true;
    if (existsSync(path.join(onDisk, 'index.html')))
      return true;
  }
  if (path.extname(url) !== '')
    return false;
  return manifestCovers(manifest, url);
}

/** First real slug built on disk under a dynamic route's parent, if any. */
function builtSlug(route) {
  const parent = route.slice(0, route.lastIndexOf('/'));
  const dir = path.join(OUTPUT_DIR, parent);
  if (!existsSync(dir))
    return undefined;
  const entry = readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('_'))
    .map(e => e.name)
    .sort()[0];
  return entry ? `${parent}/${entry}` : undefined;
}

/** Checks one router route, pushing any problems onto `failures`. */
function checkRoute(manifest, route, failures) {
  const concrete = route.replaceAll(/\[[^\]]+\]/g, BOGUS);

  if (!route.includes('[')) {
    if (!resolves(manifest, route || '/'))
      failures.push(`${route}: does not resolve; prerender it or add it to clientOnlyRoutes`);
    return 1;
  }

  // A token route the build cannot enumerate must be covered wholesale.
  if (manifestCovers(manifest, concrete))
    return 1;

  // Otherwise a real slug must be on disk, and a bogus one must 404.
  const real = builtSlug(route);
  if (!real)
    failures.push(`${route}: no page built under it, every URL in this subtree will 404`);
  else if (!resolves(manifest, real))
    failures.push(`${route}: built slug ${real} does not resolve`);

  if (resolves(manifest, concrete))
    failures.push(`${route}: bogus slug resolves, expected a 404`);

  return 2;
}

function main() {
  const manifestPath = path.join(OUTPUT_DIR, MANIFEST);
  if (!existsSync(manifestPath)) {
    consola.error(`${manifestPath} not found. Run \`pnpm generate\` first.`);
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  const routes = [...new Set(collectRoutes(PAGES_DIR))].sort();
  const failures = [];
  let checks = 0;

  // The manifest naming a file proves nothing on its own. `build:copy` can fail
  // to copy the card-payment app, and no `pages/` route maps to that subtree, so
  // nothing below would catch its absence.
  for (const rel of [manifest.spaShell, manifest.notFound, ...(manifest.nestedApps ?? []).map(a => a.index)]) {
    checks++;
    if (!existsSync(path.join(OUTPUT_DIR, rel)))
      failures.push(`manifest references ${rel}, which is not in the build output`);
  }

  for (const route of routes)
    checks += checkRoute(manifest, route, failures);

  if (failures.length > 0) {
    consola.error(`${failures.length} route problem(s):`);
    for (const f of failures)
      consola.error(`  ${f}`);
    process.exit(1);
  }

  consola.success(`${checks} checks passed across ${routes.length} router routes`);
}

main();

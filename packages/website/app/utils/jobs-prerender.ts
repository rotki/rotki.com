import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const JOBS_DIR = path.resolve(import.meta.dirname, '../../content/jobs');

function jobFiles(): string[] {
  return readdirSync(JOBS_DIR).filter(file => file.endsWith('.md') && !file.startsWith('_'));
}

/** Nuxt Content strips the numeric ordering prefix: `1.backend.md` -> `/jobs/backend`. */
function jobRoute(file: string): string {
  return `/jobs/${file.replace(/\.md$/, '').replace(/^\d+\./, '')}`;
}

/**
 * Build-time helper: resolves the list of `/jobs/<slug>` routes to prerender
 * from the markdown files in `content/jobs`. Mirrors the comparisons and
 * features helpers.
 *
 * Needed because the jobs listing only links to roles with `open: true`, so
 * `crawlLinks` discovers nothing when every role is closed. Without this the
 * detail pages are absent from the build and the static handler hard-404s them.
 *
 * Nuxt Content strips the numeric ordering prefix, so `1.backend.md` is served
 * at `/jobs/backend`.
 */
export function jobsPrerenderRoutes(): string[] {
  return jobFiles().map(file => jobRoute(file));
}

/**
 * Build-time helper: routes for roles with `open: false` in their frontmatter.
 *
 * Prerendering every role means closed ones are now built and would otherwise
 * be listed in the sitemap, advertising positions nobody can apply to. They stay
 * prerendered so the URLs resolve, but are kept out of the sitemap and carry
 * `noindex` (see app/pages/jobs/[id].vue).
 */
export function closedJobRoutes(): string[] {
  return jobFiles()
    .filter((file) => {
      const frontmatter = readFileSync(path.join(JOBS_DIR, file), 'utf8').split('---')[1] ?? '';
      return /^open:\s*false\s*$/m.test(frontmatter);
    })
    .map(file => jobRoute(file));
}

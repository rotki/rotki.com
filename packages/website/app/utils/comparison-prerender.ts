import { readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Build-time helper: resolves the list of `/compare/<slug>` routes to prerender
 * from the markdown files in `content/comparisons`. Mirrors the integrations
 * prerender helper so every comparison page is statically generated (and its OG
 * card rendered) even if it is not reachable via crawled links.
 */
export function comparisonPrerenderRoutes(): string[] {
  const dir = path.resolve(import.meta.dirname, '../../content/comparisons');
  return readdirSync(dir)
    .filter(file => file.endsWith('.md') && !file.startsWith('_'))
    .map(file => `/compare/${file.replace(/\.md$/, '')}`);
}

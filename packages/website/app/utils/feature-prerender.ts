import { readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Build-time helper: resolves the list of `/features/<slug>` routes to prerender
 * from the markdown files in `content/features`. Mirrors the comparisons prerender
 * helper so every feature page is statically generated (and its OG card rendered)
 * even if it is not reachable via crawled links.
 */
export function featurePrerenderRoutes(): string[] {
  const dir = path.resolve(import.meta.dirname, '../../content/features');
  return readdirSync(dir)
    .filter(file => file.endsWith('.md') && !file.startsWith('_'))
    .map(file => `/features/${file.replace(/\.md$/, '')}`);
}

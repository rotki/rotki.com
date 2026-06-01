import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { consolidateSlug, integrationSlug } from './integration-slug';

const integrationItem = z.object({ label: z.string() });
const integrationFileSchema = z.object({
  blockchains: z.array(integrationItem),
  exchanges: z.array(integrationItem),
  protocols: z.array(integrationItem),
});

/**
 * Build-time helper: resolves the list of `/integrations/<slug>` routes to
 * prerender from the canonical `public/integrations/all.json` catalog.
 */
export function integrationPrerenderRoutes(): string[] {
  const file = path.resolve(import.meta.dirname, '../../public/integrations/all.json');
  const data = integrationFileSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
  const all = [...data.blockchains, ...data.exchanges, ...data.protocols];
  const slugs = new Set<string>();
  for (const item of all) {
    // Fold granular catalog entries into their consolidated page slug so we never
    // prerender a route that has no content page (which would 404 and pollute the sitemap).
    const slug = consolidateSlug(integrationSlug(item.label));
    if (slug)
      slugs.add(slug);
  }
  return Array.from(slugs, slug => `/integrations/${slug}`);
}

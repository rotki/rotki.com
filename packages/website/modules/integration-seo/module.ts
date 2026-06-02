import type { Buffer } from 'node:buffer';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineNuxtModule, useLogger } from '@nuxt/kit';
import { parse as parseYaml } from 'yaml';
import { type OgFonts, renderOgImage } from './og-image';

const moduleDir = dirname(fileURLToPath(import.meta.url));

/**
 * With SSR enabled, `nuxi generate` already bakes the per-page <title>/meta/JSON-LD
 * into the prerendered HTML of every `/integrations/<slug>` route (set by `usePageSeo`
 * + `pages/integrations/[slug].vue`). The only thing the renderer cannot produce is the
 * per-integration Open Graph card image.
 *
 * This module renders one OG PNG per integration during prerender and writes it to
 * `img/og/integrations/<slug>.png`. The page points `og:image` at that path, so on any
 * render failure we copy the shared `share.png` to the same path to guarantee the URL
 * resolves. All filesystem access happens inside the `prerender:generate` hook, which
 * only runs during `nuxi generate` - never during dev.
 */

interface IntegrationFrontmatter {
  label?: string;
  type?: 'exchange' | 'blockchain' | 'protocol';
  tagline?: string;
}

const TYPE_LABELS: Record<string, string> = {
  exchange: 'Exchange',
  blockchain: 'Blockchain',
  protocol: 'Protocol',
};

function readFrontmatter(file: string): IntegrationFrontmatter | undefined {
  const raw = readFileSync(file, 'utf8');
  const match = raw.match(/^---\r?\n([\S\s]*?)\r?\n---/);
  if (!match?.[1])
    return undefined;

  return parseYaml(match[1]) as IntegrationFrontmatter;
}

function buildFrontmatterMap(contentDir: string): Map<string, IntegrationFrontmatter> {
  const map = new Map<string, IntegrationFrontmatter>();
  for (const file of readdirSync(contentDir)) {
    if (!file.endsWith('.md') || file.startsWith('_'))
      continue;

    const fm = readFrontmatter(resolve(contentDir, file));
    if (fm)
      map.set(file.replace(/\.md$/, ''), fm);
  }
  return map;
}

export default defineNuxtModule({
  meta: { name: 'integration-seo' },
  setup(_options, nuxt) {
    const logger = useLogger('integration-seo');
    const contentDir = resolve(nuxt.options.rootDir, 'content/integrations');
    let fonts: OgFonts | undefined;
    try {
      fonts = {
        regular: readFileSync(resolve(moduleDir, 'fonts/roboto-400.woff')),
        bold: readFileSync(resolve(moduleDir, 'fonts/roboto-700.woff')),
      };
    }
    catch {
      logger.warn('OG fonts not found; falling back to the shared share.png');
    }

    nuxt.hook('nitro:init', (nitro) => {
      const publicDir = nitro.options.output.publicDir;
      let map: Map<string, IntegrationFrontmatter> | undefined;
      let sharePng: Buffer | undefined;
      let ogGenerated = 0;
      let fallback = 0;
      const skipped = new Set<string>();

      // Write the shared share.png to the per-slug path so the page's `og:image`
      // URL always resolves, even when rendering the bespoke card fails.
      const writeFallback = (relPath: string): void => {
        try {
          sharePng ??= readFileSync(resolve(publicDir, 'img/og/share.png'));
          mkdirSync(resolve(publicDir, dirname(relPath)), { recursive: true });
          writeFileSync(resolve(publicDir, relPath), sharePng);
          fallback += 1;
        }
        catch (error) {
          logger.warn(`OG fallback copy failed for ${relPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      };

      nitro.hooks.hook('prerender:generate', async (route) => {
        const slug = route.route.match(/^\/integrations\/([^/]+)\/?$/)?.[1];
        if (!slug)
          return;

        map ??= buildFrontmatterMap(contentDir);
        const fm = map.get(slug);
        if (!fm) {
          skipped.add(slug);
          return;
        }

        const relPath = `img/og/integrations/${slug}.png`;
        if (!fonts) {
          writeFallback(relPath);
          return;
        }

        try {
          const png = await renderOgImage({
            label: fm.label ?? slug,
            tagline: fm.tagline ?? '',
            typeLabel: TYPE_LABELS[fm.type ?? ''] ?? 'Integration',
            fonts,
          });
          mkdirSync(resolve(publicDir, dirname(relPath)), { recursive: true });
          writeFileSync(resolve(publicDir, relPath), png);
          ogGenerated += 1;
        }
        catch (error) {
          logger.warn(`OG image generation failed for ${slug}: ${error instanceof Error ? error.message : String(error)}`);
          writeFallback(relPath);
        }
      });

      nitro.hooks.hook('close', () => {
        const suffix = skipped.size > 0 ? `; skipped ${skipped.size} slug(s) with no content page: ${[...skipped].sort().join(', ')}` : '';
        logger.info(`generated ${ogGenerated} integration OG images (${fallback} share.png fallbacks)${suffix}`);
      });
    });
  },
});

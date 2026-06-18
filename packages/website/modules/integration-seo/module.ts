import type { ParsedContentFile } from '@nuxt/content';
import type { Buffer } from 'node:buffer';
import type { z } from 'zod';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineNuxtModule, useLogger } from '@nuxt/kit';
import { parse as parseYaml } from 'yaml';
import { integrationSchema } from '../../shared/content-schemas';
import { type OgFonts, renderOgImage } from './og-image';

const moduleDir = dirname(fileURLToPath(import.meta.url));

/**
 * Build-time augmentation that completes integration output for external crawlers:
 *
 * 1. Open Graph card images. With SSR enabled, `nuxi generate` already bakes the
 *    per-page <title>/meta/JSON-LD into each `/integrations/<slug>` route, but it
 *    cannot produce the OG card. This module renders one PNG per integration into
 *    `img/og/integrations/<slug>.png` during `prerender:generate` (with a share.png
 *    fallback so `og:image` always resolves).
 *
 * 2. Markdown body for nuxt-llms. Integration content lives entirely in frontmatter,
 *    so the markdown body is empty and `llms-full.txt` + `/raw/*.md` would be hollow.
 *    A `content:file:afterParse` hook synthesises a body (intro + features +
 *    limitations + setup + FAQ) from the frontmatter. This does not affect the
 *    rendered page, which reads the frontmatter fields directly.
 */

// Only label/type/tagline are needed for OG cards; pick them off the canonical
// collection schema (made optional, since this runs before content validation).
const IntegrationFrontmatterSchema = integrationSchema.pick({ label: true, type: true, tagline: true }).partial();

type IntegrationFrontmatter = z.infer<typeof IntegrationFrontmatterSchema>;

// minimark AST node: [tag, props, ...children]. Children are loosely typed as
// `unknown` because a recursive tuple-rest alias isn't allowed in TypeScript.
type MinimarkNode = [string, Record<string, unknown>, ...unknown[]];

interface IntegrationDoc {
  label?: string;
  title?: string;
  description?: string;
  type?: string;
  intro?: string;
  features?: string[];
  limitations?: string[];
  setup?: string[];
  faq?: Array<{ q: string; a: string }>;
  body?: { value?: unknown[] };
}

// Narrow the generic parsed-content shape to this collection's view via a runtime
// guard (no cast). Requires the two fields the hook actually reads — `intro` and a
// `body.value` array — so the body-synthesis branch can run; the rest of
// `IntegrationDoc` is the asserted frontmatter view.
function isIntegrationDoc(
  content: ParsedContentFile,
): content is ParsedContentFile & IntegrationDoc & { intro: string; body: { value: unknown[] } } {
  return typeof content.intro === 'string' && content.intro.length > 0
    && typeof content.body === 'object' && content.body !== null
    && 'value' in content.body && Array.isArray(content.body.value);
}

function listSection(heading: string, items: string[] | undefined, tag: 'ul' | 'ol'): MinimarkNode[] {
  if (!Array.isArray(items) || items.length === 0)
    return [];

  return [
    ['h2', {}, heading],
    [tag, {}, ...items.map((item): MinimarkNode => ['li', {}, item])],
  ];
}

// Synthesise a markdown body AST from integration frontmatter. Starts with an h1 so
// nuxt-llms' full generator and the /raw endpoint render it verbatim (no double title).
function buildIntegrationBody(doc: IntegrationDoc): MinimarkNode[] {
  const value: MinimarkNode[] = [['h1', {}, doc.label ?? doc.title ?? '']];
  if (doc.intro)
    value.push(['p', {}, doc.intro]);

  value.push(...listSection('Features', doc.features, 'ul'));
  value.push(...listSection('Limitations', doc.limitations, 'ul'));
  value.push(...listSection('Setup', doc.setup, 'ol'));

  if (Array.isArray(doc.faq) && doc.faq.length > 0) {
    value.push(['h2', {}, 'FAQ']);
    for (const { q, a } of doc.faq) {
      value.push(['h3', {}, q], ['p', {}, a]);
    }
  }
  return value;
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

  const parsed = IntegrationFrontmatterSchema.safeParse(parseYaml(match[1]));
  return parsed.success ? parsed.data : undefined;
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

    // Synthesise a markdown body from frontmatter so nuxt-llms (llms-full.txt + /raw)
    // emits real content instead of empty docs.
    nuxt.hook('content:file:afterParse', (ctx) => {
      if (ctx.collection.name !== 'integrations')
        return;

      if (!isIntegrationDoc(ctx.content))
        return;

      // Mutations below write back through the same reference.
      const doc = ctx.content;

      // Content auto-derives the title as PascalCase of the filename ("Binance Us");
      // prefer the proper label. `description` is unused by integrations — fill it from
      // intro so llms.txt link descriptions and the /raw blockquote are populated.
      if (doc.label)
        doc.title = doc.label;
      if (!doc.description)
        doc.description = doc.intro;
      if (doc.body.value.length === 0)
        doc.body.value = buildIntegrationBody(doc);
    });

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

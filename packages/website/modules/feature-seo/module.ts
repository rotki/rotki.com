import type { ParsedContentFile } from '@nuxt/content';
import type { Buffer } from 'node:buffer';
import type { z } from 'zod';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineNuxtModule, useLogger } from '@nuxt/kit';
import { parse as parseYaml } from 'yaml';
import { featureSchema } from '../../shared/content-schemas';
import { type OgFonts, renderOgImage } from '../integration-seo/og-image';

const moduleDir = dirname(fileURLToPath(import.meta.url));

/**
 * Build-time augmentation for the `/features/<slug>` pages, mirroring the
 * comparison-seo module:
 *
 * 1. Open Graph card images. `nuxi generate` bakes the per-page head/JSON-LD into
 *    each route but cannot produce the OG card, so this module renders one PNG per
 *    feature into `img/og/features/<slug>.png` during `prerender:generate` (with a
 *    share.png fallback so `og:image` always resolves).
 *
 * 2. Markdown body for nuxt-llms. Feature content lives mostly in frontmatter, so a
 *    `content:file:afterParse` hook synthesises a body (intro + capabilities + setup
 *    + limitations + troubleshooting + FAQ) so `llms-full.txt` and the `/raw/*.md`
 *    endpoint expose real content. This does not affect the rendered page.
 */

// Only label/tagline are needed for OG cards; pick them off the canonical
// collection schema (made optional, since this runs before content validation).
const FeatureFrontmatterSchema = featureSchema.pick({ label: true, tagline: true }).partial();

type FeatureFrontmatter = z.infer<typeof FeatureFrontmatterSchema>;

// minimark AST node: [tag, props, ...children].
type MinimarkNode = [string, Record<string, unknown>, ...unknown[]];

interface FeatureDoc {
  label?: string;
  title?: string;
  description?: string;
  intro?: string;
  capabilities?: string[];
  setup?: string[];
  limitations?: string[];
  troubleshooting?: Array<{ problem: string; fix: string }>;
  faq?: Array<{ q: string; a: string }>;
  body?: { value?: unknown[] };
}

// Narrow the generic parsed-content shape to this collection's view via a runtime
// guard (no cast). Requires the two fields the hook actually reads — `intro` and a
// `body.value` array — so the body-synthesis branch can run; the rest of `FeatureDoc`
// is the asserted frontmatter view.
function isFeatureDoc(
  content: ParsedContentFile,
): content is ParsedContentFile & FeatureDoc & { intro: string; body: { value: unknown[] } } {
  return typeof content.intro === 'string' && content.intro.length > 0
    && typeof content.body === 'object' && content.body !== null
    && 'value' in content.body && Array.isArray(content.body.value);
}

function listSection(heading: string, items: string[] | undefined): MinimarkNode[] {
  if (!Array.isArray(items) || items.length === 0)
    return [];

  return [
    ['h2', {}, heading],
    ['ul', {}, ...items.map((item): MinimarkNode => ['li', {}, item])],
  ];
}

// Synthesise a markdown body AST from feature frontmatter. Starts with an h1 so
// nuxt-llms' full generator and the /raw endpoint render it verbatim (no double title).
function buildFeatureBody(doc: FeatureDoc): MinimarkNode[] {
  const label = doc.label ?? doc.title ?? '';
  const value: MinimarkNode[] = [['h1', {}, label]];
  if (doc.intro)
    value.push(['p', {}, doc.intro]);

  value.push(...listSection('What rotki supports', doc.capabilities));
  value.push(...listSection('How to set it up', doc.setup));
  value.push(...listSection('Good to know', doc.limitations));

  if (Array.isArray(doc.troubleshooting) && doc.troubleshooting.length > 0) {
    value.push(['h2', {}, 'Common problems and fixes']);
    for (const { problem, fix } of doc.troubleshooting) {
      value.push(['h3', {}, problem], ['p', {}, fix]);
    }
  }

  if (Array.isArray(doc.faq) && doc.faq.length > 0) {
    value.push(['h2', {}, 'FAQ']);
    for (const { q, a } of doc.faq) {
      value.push(['h3', {}, q], ['p', {}, a]);
    }
  }
  return value;
}

function readFrontmatter(file: string): FeatureFrontmatter | undefined {
  const raw = readFileSync(file, 'utf8');
  const match = raw.match(/^---\r?\n([\S\s]*?)\r?\n---/);
  if (!match?.[1])
    return undefined;

  const parsed = FeatureFrontmatterSchema.safeParse(parseYaml(match[1]));
  return parsed.success ? parsed.data : undefined;
}

function buildFrontmatterMap(contentDir: string): Map<string, FeatureFrontmatter> {
  const map = new Map<string, FeatureFrontmatter>();
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
  meta: { name: 'feature-seo' },
  setup(_options, nuxt) {
    const logger = useLogger('feature-seo');
    const contentDir = resolve(nuxt.options.rootDir, 'content/features');
    let fonts: OgFonts | undefined;
    try {
      fonts = {
        regular: readFileSync(resolve(moduleDir, '../integration-seo/fonts/roboto-400.woff')),
        bold: readFileSync(resolve(moduleDir, '../integration-seo/fonts/roboto-700.woff')),
      };
    }
    catch {
      logger.warn('OG fonts not found; falling back to the shared share.png');
    }

    // Synthesise a markdown body from frontmatter so nuxt-llms (llms-full.txt + /raw)
    // emits real content instead of empty docs.
    nuxt.hook('content:file:afterParse', (ctx) => {
      if (ctx.collection.name !== 'features')
        return;

      if (!isFeatureDoc(ctx.content))
        return;

      // Mutations below write back through the same reference.
      const doc = ctx.content;

      if (doc.label)
        doc.title = doc.label;
      if (!doc.description)
        doc.description = doc.intro;
      if (doc.body.value.length === 0)
        doc.body.value = buildFeatureBody(doc);
    });

    nuxt.hook('nitro:init', (nitro) => {
      const publicDir = nitro.options.output.publicDir;
      let map: Map<string, FeatureFrontmatter> | undefined;
      let sharePng: Buffer | undefined;
      let ogGenerated = 0;
      let fallback = 0;
      const skipped = new Set<string>();

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
        const slug = route.route.match(/^\/features\/([^/]+)\/?$/)?.[1];
        if (!slug)
          return;

        map ??= buildFrontmatterMap(contentDir);
        const fm = map.get(slug);
        if (!fm) {
          skipped.add(slug);
          return;
        }

        const relPath = `img/og/features/${slug}.png`;
        if (!fonts) {
          writeFallback(relPath);
          return;
        }

        try {
          const png = await renderOgImage({
            label: fm.label ?? slug,
            tagline: fm.tagline ?? '',
            typeLabel: 'Feature',
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
        logger.info(`generated ${ogGenerated} feature OG images (${fallback} share.png fallbacks)${suffix}`);
      });
    });
  },
});

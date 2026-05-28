import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { defineNuxtModule, useLogger } from '@nuxt/kit';
import { parse as parseYaml } from 'yaml';
import { type OgFonts, renderOgImage } from './og-image';

const moduleDir = dirname(fileURLToPath(import.meta.url));

/**
 * Because the site is rendered as a SPA (`ssr: false`), `nuxi generate` only emits the
 * app shell for each route and the per-page <title>/meta/JSON-LD are set by client JS.
 * Crawlers and social-card scrapers read the static HTML head, so they would only ever
 * see the generic "rotki.com | rotki" title for every integration page.
 *
 * This module injects the proper per-page head into the prerendered HTML of every
 * `/integrations/<slug>` route, sourced from the md frontmatter, mirroring what
 * `usePageSeo` + `pages/integrations/[slug].vue` set on the client. All filesystem
 * access happens inside the `prerender:generate` hook, which only runs during
 * `nuxi generate` - never during dev.
 */

interface FaqEntry { q: string; a: string }

interface IntegrationFrontmatter {
  label?: string;
  type?: 'exchange' | 'blockchain' | 'protocol';
  tagline?: string;
  intro?: string;
  keywords?: string;
  faq?: FaqEntry[];
}

const TYPE_LABELS: Record<string, string> = {
  exchange: 'Exchange',
  blockchain: 'Blockchain',
  protocol: 'Protocol',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

function buildHead(fm: IntegrationFrontmatter, url: string, ogImage: string, baseUrl: string): string {
  const label = fm.label ?? '';
  const tagline = fm.tagline ?? label;
  const title = `${label} integration with rotki - ${tagline} | rotki`;
  const description = fm.intro ?? '';

  const meta: string[] = [
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}">`,
    `<meta property="twitter:url" content="${escapeHtml(url)}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
  ];

  if (fm.keywords)
    meta.push(`<meta name="keywords" content="${escapeHtml(fm.keywords)}">`);

  const ld: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': baseUrl },
        { '@type': 'ListItem', 'position': 2, 'name': 'Integrations', 'item': `${baseUrl}/integrations` },
        { '@type': 'ListItem', 'position': 3, 'name': label, 'item': url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': `rotki - ${label} integration`,
      'description': description,
      'url': url,
      'applicationCategory': 'FinanceApplication',
      'operatingSystem': 'Windows, macOS, Linux',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
    },
  ];

  if (fm.faq && fm.faq.length > 0) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': fm.faq.map(({ q, a }) => ({
        '@type': 'Question',
        'name': q,
        'acceptedAnswer': { '@type': 'Answer', 'text': a },
      })),
    });
  }

  const ldScripts = ld.map(block => `<script type="application/ld+json">${JSON.stringify(block).replace(/</g, '\\u003c')}</script>`);

  return [...meta, ...ldScripts].join('');
}

export default defineNuxtModule({
  meta: { name: 'integration-seo' },
  setup(_options, nuxt) {
    const logger = useLogger('integration-seo');
    const contentDir = resolve(nuxt.options.rootDir, 'content/integrations');
    const baseUrl = (process.env.NUXT_PUBLIC_BASE_URL ?? nuxt.options.runtimeConfig?.public?.baseUrl ?? '').replace(/\/+$/, '');
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
      let injected = 0;
      let ogGenerated = 0;
      const skipped = new Set<string>();

      nitro.hooks.hook('prerender:generate', async (route) => {
        const slug = route.route.match(/^\/integrations\/([^/]+)\/?$/)?.[1];
        if (!slug || typeof route.contents !== 'string' || !route.contents.includes('</head>'))
          return;

        map ??= buildFrontmatterMap(contentDir);
        const fm = map.get(slug);
        if (!fm) {
          skipped.add(slug);
          return;
        }

        const url = `${baseUrl}${route.route.replace(/\/+$/, '')}`;
        const title = `${fm.label ?? ''} integration with rotki - ${fm.tagline ?? fm.label ?? ''} | rotki`;

        // Generate a per-page OG card; fall back to the shared share.png on any failure.
        let ogImage = `${baseUrl}/img/og/share.png`;
        if (fonts) {
          try {
            const png = await renderOgImage({
              label: fm.label ?? slug,
              tagline: fm.tagline ?? '',
              typeLabel: TYPE_LABELS[fm.type ?? ''] ?? 'Integration',
              fonts,
            });
            const relPath = `img/og/integrations/${slug}.png`;
            mkdirSync(resolve(publicDir, dirname(relPath)), { recursive: true });
            writeFileSync(resolve(publicDir, relPath), png);
            ogImage = `${baseUrl}/${relPath}`;
            ogGenerated += 1;
          }
          catch (error) {
            logger.warn(`OG image generation failed for ${slug}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        let html = route.contents;
        // Replace the generic title with the per-page one.
        html = html.replace(/<title>[\S\s]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
        // Inject the per-page meta + JSON-LD right before </head>.
        html = html.replace('</head>', `${buildHead(fm, url, ogImage, baseUrl)}</head>`);
        route.contents = html;
        injected += 1;
      });

      nitro.hooks.hook('close', () => {
        const suffix = skipped.size > 0 ? `; skipped ${skipped.size} slug(s) with no content page: ${[...skipped].sort().join(', ')}` : '';
        logger.info(`injected SEO head into ${injected} integration pages (${ogGenerated} OG images generated)${suffix}`);
      });
    });
  },
});

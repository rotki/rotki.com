import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Adds the site's regular Nuxt pages (download, pricing, values, ...) to the
 * generated `llms.txt` and `llms-full.txt`.
 *
 * nuxt-llms only lists `@nuxt/content` collections, so pages built as plain
 * Vue routes are invisible to it. Their title and description already exist as
 * SEO metadata (`usePageSeo`), and every public page is prerendered, so after
 * prerendering we read that metadata back out of the generated HTML. A new page
 * shows up here without extra wiring, and the text always matches what search
 * engines see.
 *
 * Build-time only: `nuxi dev` serves `/llms.txt` without this section.
 */

export interface LlmsPage {
  path: string;
  title: string;
  description: string;
}

const SECTION_TITLE = 'Pages';

const SECTION_DESCRIPTION = 'The main pages of rotki.com: downloads, pricing, premium features, sponsorship, careers, and legal terms.';

/**
 * Detail pages of the collections nuxt-llms already lists (with richer content
 * than the meta description). Their hub pages (`/integrations`, ...) are kept.
 */
const COLLECTION_PREFIXES: readonly string[] = ['/integrations/', '/compare/', '/features/'];

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': '\'',
  '&#x27;': '\'',
  '&lt;': '<',
  '&gt;': '>',
};

function decodeEntities(value: string): string {
  return value.replace(/&(?:amp|quot|#39|#x27|lt|gt);/g, entity => ENTITIES[entity] ?? entity);
}

/**
 * Returns the `content` of the first `<meta>` tag whose `attribute` equals
 * `value`, regardless of attribute order.
 */
function metaContent(html: string, attribute: 'name' | 'property', value: string): string | undefined {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (!new RegExp(`\\s${attribute}="${value}"`, 'i').test(tag))
      continue;
    const content = /\scontent="([^"]*)"/i.exec(tag)?.[1];
    return content === undefined ? undefined : decodeEntities(content).trim();
  }
  return undefined;
}

/** og:title is the bare page title; `<title>` has the site-wide template applied, so it is only the fallback. */
function pageTitle(html: string): string {
  const ogTitle = metaContent(html, 'property', 'og:title');
  if (ogTitle)
    return ogTitle;
  return decodeEntities(/<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? '').trim();
}

/**
 * Returns the route a generated `index.html` file maps to, e.g.
 * `products/index.html` maps to `/products` and `index.html` to `/`.
 */
export function routeForFile(relFile: string): string {
  const posix = relFile.split(path.sep).join('/');
  const route = `/${posix.replace(/index\.html$/, '').replace(/\/$/, '')}`;
  return route === '/' ? '/' : route;
}

/**
 * Extracts the llms entry for one prerendered page, or undefined when the page
 * should not be listed: noindex pages, redirect stubs, collection detail pages
 * and pages without a description.
 */
export function extractLlmsPage(html: string, route: string): LlmsPage | undefined {
  if (COLLECTION_PREFIXES.some(prefix => route.startsWith(prefix)))
    return undefined;

  const robots = metaContent(html, 'name', 'robots');
  if (robots && /noindex/i.test(robots))
    return undefined;

  // `nuxi generate` writes `<meta http-equiv="refresh">` stubs for redirects (e.g. /pricing).
  if (/<meta\b[^>]*http-equiv="refresh"/i.test(html))
    return undefined;

  const description = metaContent(html, 'name', 'description');
  if (!description)
    return undefined;

  const title = pageTitle(html);
  if (!title)
    return undefined;

  return { path: route, title, description };
}

/** Home first, then alphabetical by path, so the output is stable between builds. */
function comparePages(a: LlmsPage, b: LlmsPage): number {
  if (a.path === '/')
    return -1;
  if (b.path === '/')
    return 1;
  return a.path.localeCompare(b.path, 'en');
}

function pageUrl(domain: string, page: LlmsPage): string {
  const base = domain.replace(/\/$/, '');
  return page.path === '/' ? base : `${base}${page.path}`;
}

/**
 * Inserts the pages section into `llms.txt` before `beforeSection` (the first
 * configured nuxt-llms section), or appends it when that heading is missing.
 */
export function addPagesToLlmsTxt(llmsTxt: string, pages: LlmsPage[], domain: string, beforeSection: string | undefined): string {
  const links = pages.map(page => `- [${page.title}](${pageUrl(domain, page)}): ${page.description}`);
  const section = [`## ${SECTION_TITLE}`, SECTION_DESCRIPTION, links.join('\n')].join('\n\n');

  const marker = beforeSection ? `\n\n## ${beforeSection}\n` : undefined;
  const index = marker ? llmsTxt.indexOf(marker) : -1;
  if (index === -1)
    return `${llmsTxt.trimEnd()}\n\n${section}\n`;
  return `${llmsTxt.slice(0, index)}\n\n${section}${llmsTxt.slice(index)}`;
}

/** Prepends one document per page to `llms-full.txt`, in the same shape as the content documents. */
export function addPagesToLlmsFullTxt(llmsFullTxt: string, pages: LlmsPage[], domain: string): string {
  const documents = pages.map(page => `# ${page.title}\n\nURL: ${pageUrl(domain, page)}\n\n${page.description}`);
  return [...documents, llmsFullTxt].join('\n\n');
}

/** Reads the llms entries of every prerendered `index.html` under `publicDir`. */
export function collectLlmsPages(publicDir: string): LlmsPage[] {
  return readdirSync(publicDir, { recursive: true, encoding: 'utf8' })
    .filter(file => file.split(path.sep).join('/').endsWith('index.html'))
    .map(file => extractLlmsPage(readFileSync(path.join(publicDir, file), 'utf8'), routeForFile(file)))
    .filter((page): page is LlmsPage => page !== undefined)
    .sort(comparePages);
}

/**
 * Build-time helper: patches the generated `llms.txt` and `llms-full.txt` with
 * the prerendered pages. Runs on `prerender:done`, after every page and both
 * llms files are written.
 */
export function writeLlmsPages(publicDir: string, domain: string, beforeSection: string | undefined): number {
  const pages = collectLlmsPages(publicDir);
  if (pages.length === 0)
    return 0;

  // A missing llms.txt means nuxt-llms is broken; fail the build instead of shipping without it.
  const llmsTxtPath = path.join(publicDir, 'llms.txt');
  writeFileSync(llmsTxtPath, addPagesToLlmsTxt(readFileSync(llmsTxtPath, 'utf8'), pages, domain, beforeSection));

  // llms-full.txt only exists when the `full` option is set.
  const llmsFullPath = path.join(publicDir, 'llms-full.txt');
  if (existsSync(llmsFullPath))
    writeFileSync(llmsFullPath, addPagesToLlmsFullTxt(readFileSync(llmsFullPath, 'utf8'), pages, domain));

  return pages.length;
}

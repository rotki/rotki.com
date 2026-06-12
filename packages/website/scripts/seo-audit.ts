/**
 * Deterministic SEO audit over the generated static site (`nuxi generate` output).
 *
 * Parses every prerendered page and checks the SEO invariants that matter for
 * indexing — a single absolute canonical that matches the production URL, a
 * title and meta description, the core Open Graph tags, crawlable anchors, one
 * <h1>, and a lang attribute — then prints a grouped report.
 *
 * Why a script instead of Lighthouse: Lighthouse audits one page at a time
 * served from localhost, so it mis-flags absolute canonicals as "different
 * domain" and can't realistically cover 140+ pages. Parsing the HTML directly
 * against the production base URL covers EVERY page, never flakes, and runs in
 * seconds — ideal for catching accidental SEO regressions on every PR.
 *
 * Usage:
 *   pnpm tsx scripts/seo-audit.ts [distDir] [--base=https://rotki.com] [--strict]
 *
 * Defaults: distDir=.output/public, base=https://rotki.com.
 * Report-only by default (always exits 0); pass --strict to exit 1 on issues.
 */

import { appendFileSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rawArgs: string[] = process.argv.slice(2);
const strict: boolean = rawArgs.includes('--strict');
const baseArg: string | undefined = rawArgs.find(a => a.startsWith('--base='))?.slice('--base='.length);
const distArg: string | undefined = rawArgs.find(a => !a.startsWith('--'));
const BASE: string = (baseArg ?? 'https://rotki.com').replace(/\/$/, '');
const DIST: string = distArg ?? '.output/public';

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;
const OG_REQUIRED: readonly string[] = ['og:title', 'og:description', 'og:url', 'og:image'];

type Severity = 'error' | 'warn';

// Errors break indexing/crawling; warnings are quality nits that won't deindex a page.
const SEVERITY: Record<string, Severity> = {
  'missing-canonical': 'error',
  'relative-canonical': 'error',
  'wrong-canonical': 'error',
  'multiple-canonical': 'error',
  'missing-title': 'error',
  'missing-description': 'error',
  'non-crawlable-anchor': 'error',
  'missing-lang': 'error',
  'missing-og': 'warn',
  'missing-h1': 'warn',
  'long-title': 'warn',
  'long-description': 'warn',
};

function severityOf(type: string): Severity {
  return SEVERITY[type] ?? 'error';
}

interface Issue {
  type: string;
  detail?: string;
}

interface PageReport {
  route: string;
  noindex: boolean;
  issues: Issue[];
}

/**
 * Returns the route a generated `index.html` file maps to, e.g.
 * `products/index.html` -> `/products`, `index.html` -> `/`.
 */
function routeFor(relFile: string): string {
  const posix = relFile.split(path.sep).join('/');
  const route = `/${posix.replace(/index\.html$/, '').replace(/\/$/, '')}`;
  return route === '/' ? '/' : route;
}

/**
 * Extracts the href value from an `<a>` tag's attribute string, or undefined if
 * the tag has no href attribute at all.
 */
function anchorHref(attrs: string): string | undefined {
  const match = /\shref=("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
  if (!match)
    return undefined;
  return (match[2] ?? match[3] ?? match[4] ?? '').trim();
}

/**
 * Counts anchors that search engines cannot crawl: no href, empty href, a bare
 * fragment, or a javascript: URL.
 */
function nonCrawlableAnchors(html: string): number {
  let count = 0;
  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const href = anchorHref(match[1] ?? '');
    if (href === undefined || href === '' || href === '#' || /^javascript:/i.test(href))
      count++;
  }
  return count;
}

function auditPage(html: string, route: string): PageReport {
  const issues: Issue[] = [];

  const robots = /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i.exec(html);
  const noindex: boolean = !!robots && /noindex/i.test(robots[1] ?? '');

  // noindex pages are intentionally excluded from the index — skip indexing checks.
  if (!noindex) {
    const canonicals = [...html.matchAll(/<link[^>]+rel=["']canonical["'][^>]*>/gi)];
    const expected = route === '/' ? BASE : `${BASE}${route}`;
    if (canonicals.length === 0) {
      issues.push({ type: 'missing-canonical' });
    }
    else if (canonicals.length > 1) {
      issues.push({ type: 'multiple-canonical', detail: `${canonicals.length} tags` });
    }
    else {
      const href = /href=["']([^"']*)["']/i.exec(canonicals[0]?.[0] ?? '')?.[1] ?? '';
      if (!/^https?:\/\//i.test(href))
        issues.push({ type: 'relative-canonical', detail: href || '(empty)' });
      else if (href !== expected)
        issues.push({ type: 'wrong-canonical', detail: `${href} != ${expected}` });
    }

    const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim();
    if (!title)
      issues.push({ type: 'missing-title' });
    else if (title.length > TITLE_MAX)
      issues.push({ type: 'long-title', detail: `${title.length} chars` });

    const description = /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(html)?.[1];
    if (!description)
      issues.push({ type: 'missing-description' });
    else if (description.length > DESCRIPTION_MAX)
      issues.push({ type: 'long-description', detail: `${description.length} chars` });

    for (const og of OG_REQUIRED) {
      if (!new RegExp(`property=["']${og}["']`, 'i').test(html))
        issues.push({ type: 'missing-og', detail: og });
    }

    if (!/<h1[\s>]/i.test(html))
      issues.push({ type: 'missing-h1' });
  }

  const anchors = nonCrawlableAnchors(html);
  if (anchors > 0)
    issues.push({ type: 'non-crawlable-anchor', detail: `${anchors} on page` });

  if (!/<html[^>]+\blang=/i.test(html))
    issues.push({ type: 'missing-lang' });

  return { route, noindex, issues };
}

function collectPages(distDir: string): string[] {
  return readdirSync(distDir, { recursive: true, encoding: 'utf8' })
    .filter(file => file.split(path.sep).join('/').endsWith('index.html'));
}

function main(): void {
  const files = collectPages(DIST);
  const reports: PageReport[] = files.map((file) => {
    const html = readFileSync(path.join(DIST, file), 'utf8');
    return auditPage(html, routeFor(file));
  });

  const indexable = reports.filter(r => !r.noindex);
  const pagesWithErrors = indexable.filter(r => r.issues.some(i => severityOf(i.type) === 'error'));

  // Tally pages affected per issue type, with one example route each.
  const byType = new Map<string, { pages: number; example: string; sample: string | undefined }>();
  for (const r of indexable) {
    for (const issue of r.issues) {
      const entry = byType.get(issue.type) ?? { pages: 0, example: r.route, sample: issue.detail };
      entry.pages++;
      byType.set(issue.type, entry);
    }
  }

  const rows = [...byType.entries()]
    .map(([type, info]) => ({ type, severity: severityOf(type), ...info }))
    .sort((a, b) => (a.severity === b.severity ? b.pages - a.pages : a.severity === 'error' ? -1 : 1));
  const errorRows = rows.filter(r => r.severity === 'error');

  const lines: string[] = [];
  lines.push('## 🔍 SEO audit (report-only)\n');
  lines.push(`Base: \`${BASE}\` · audited **${indexable.length}** indexable pages `
    + `(${reports.length - indexable.length} noindex skipped).\n`);
  lines.push(`**${pagesWithErrors.length}** pages with errors · `
    + `**${indexable.length - pagesWithErrors.length}** without errors · `
    + `**${errorRows.length}** error type(s).\n`);

  if (rows.length === 0) {
    lines.push('✅ No SEO issues found.');
  }
  else {
    lines.push('| Severity | Issue | Pages | Example |');
    lines.push('| --- | --- | --- | --- |');
    for (const row of rows) {
      const icon = row.severity === 'error' ? '🔴' : '🟡';
      const detail = row.sample ? ` (${row.sample})` : '';
      lines.push(`| ${icon} ${row.severity} | ${row.type} | ${row.pages} | \`${row.example}\`${detail} |`);
    }
  }

  const report = lines.join('\n');
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);

  if (strict && pagesWithErrors.length > 0)
    process.exit(1);
}

main();

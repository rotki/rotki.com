/**
 * Generates stub markdown files under content/integrations/ for every
 * blockchain, exchange, and protocol listed in public/integrations/all.json.
 *
 * Existing files are never overwritten - hand-curated content stays intact.
 *
 * Usage:
 *   pnpm gen:integration-stubs
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { integrationSlug } from '../app/utils/integration-slug';

const META_DESCRIPTION_MAX = 160;

/**
 * Derives a <=160-char SERP meta description from a longer `intro`: the whole
 * intro if it already fits, else a clean first sentence, else a word-boundary
 * trim with trailing junk stripped. Kept separate from `intro` so the visible
 * paragraph can stay long while the meta description stays within budget.
 */
function deriveMetaDescription(intro: string): string {
  const text = intro.trim().replace(/\s+/g, ' ');
  if (text.length <= META_DESCRIPTION_MAX)
    return text;

  const sentence = /^(.*?[!.?])(?:\s|$)/.exec(text)?.[1];
  if (sentence && sentence.length >= 60 && sentence.length <= META_DESCRIPTION_MAX)
    return sentence;

  return text
    .slice(0, META_DESCRIPTION_MAX)
    .replace(/\s+\S*$/, '')
    .replace(/[\s,.:;–—-]+(?:and|or|with|including)?$/i, '')
    .trim();
}

interface RawItem {
  image: string;
  label: string;
  isExchangeWithKey?: boolean;
}

interface RawData {
  blockchains: RawItem[];
  exchanges: RawItem[];
  protocols: RawItem[];
}

type IntegrationType = 'blockchain' | 'exchange' | 'protocol';

const ROOT = path.resolve(import.meta.dirname, '..');
const ALL_JSON = path.join(ROOT, 'public/integrations/all.json');
const OUT_DIR = path.join(ROOT, 'content/integrations');

const GITHUB_PREFIX = 'https://raw.githubusercontent.com/rotki/rotki/develop/frontend/app/public/assets/images/protocols/';
const LOCAL_PREFIX = '/img/integrations/';

function localizeImage(url: string): string {
  return url.startsWith(GITHUB_PREFIX) ? url.replace(GITHUB_PREFIX, LOCAL_PREFIX) : url;
}

function dedupeProtocols(protocols: RawItem[]): RawItem[] {
  const byFirstWord: Record<string, RawItem> = {};
  for (const protocol of protocols) {
    const firstWord = protocol.label.split(' ')[0];
    if (!firstWord)
      continue;
    const existing = byFirstWord[firstWord];
    if (!existing || existing.image !== protocol.image) {
      byFirstWord[firstWord] = { ...protocol };
    }
    else {
      existing.label = firstWord;
    }
  }
  return Object.values(byFirstWord);
}

function templateFor(type: IntegrationType, label: string): { tagline: string; intro: string; keywords: string } {
  switch (type) {
    case 'exchange':
      return {
        tagline: `${label} portfolio tracker`,
        intro: `Track your ${label} balances, trades, and transaction history with rotki - a local-first, privacy-focused crypto portfolio manager. Connect via read-only API or import CSV exports.`,
        keywords: `${label} portfolio tracker, ${label} tax, ${label} accounting, ${label} CSV import`,
      };
    case 'blockchain':
      return {
        tagline: `${label} portfolio tracker`,
        intro: `Track your ${label} addresses, balances, and on-chain activity with rotki - a local-first, privacy-focused portfolio manager that keeps your data on your machine.`,
        keywords: `${label} portfolio tracker, ${label} wallet tracker, ${label} accounting`,
      };
    case 'protocol':
      return {
        tagline: `${label} integration with rotki`,
        intro: `rotki decodes your ${label} on-chain activity into clear, auditable events - balances, deposits, withdrawals, and rewards - alongside the rest of your portfolio.`,
        keywords: `${label} portfolio tracker, ${label} accounting, ${label} tax, ${label} integration`,
      };
  }
}

function renderFrontmatter(item: RawItem, type: IntegrationType, slug: string): string {
  const { tagline, intro, keywords } = templateFor(type, item.label);
  const image = localizeImage(item.image);

  const lines = [
    '---',
    `slug: ${slug}`,
    `label: ${JSON.stringify(item.label)}`,
    `type: ${type}`,
    `image: ${JSON.stringify(image)}`,
    `tagline: ${JSON.stringify(tagline)}`,
    `intro: ${JSON.stringify(intro)}`,
    `metaDescription: ${JSON.stringify(deriveMetaDescription(intro))}`,
    `keywords: ${JSON.stringify(keywords)}`,
    'features: []',
    'limitations: []',
    'setup: []',
    'faq: []',
    'screenshots: []',
    'ctaPlan: free',
  ];

  if (type === 'exchange' && item.isExchangeWithKey)
    lines.push('isExchangeWithKey: true');

  lines.push('---', '');
  return `${lines.join('\n')}\n`;
}

function main(): void {
  const raw: RawData = JSON.parse(readFileSync(ALL_JSON, 'utf8'));

  if (!existsSync(OUT_DIR))
    mkdirSync(OUT_DIR, { recursive: true });

  const items: Array<{ item: RawItem; type: IntegrationType }> = [
    ...raw.blockchains.map(item => ({ item, type: 'blockchain' as const })),
    ...raw.exchanges.map(item => ({ item, type: 'exchange' as const })),
    ...dedupeProtocols(raw.protocols).map(item => ({ item, type: 'protocol' as const })),
  ];

  const slugs = new Set<string>();
  let created = 0;
  let skipped = 0;
  let collisions = 0;

  for (const { item, type } of items) {
    const slug = integrationSlug(item.label);
    if (!slug) {
      console.warn(`Skipping item with empty slug: ${item.label}`);
      continue;
    }
    if (slugs.has(slug)) {
      console.warn(`Slug collision: ${slug} (${item.label})`);
      collisions++;
      continue;
    }
    slugs.add(slug);

    const file = path.join(OUT_DIR, `${slug}.md`);
    if (existsSync(file)) {
      skipped++;
      continue;
    }
    writeFileSync(file, renderFrontmatter(item, type, slug));
    created++;
  }

  console.log(`Stubs: ${created} created, ${skipped} preserved, ${collisions} collisions, ${slugs.size} unique slugs.`);
}

main();

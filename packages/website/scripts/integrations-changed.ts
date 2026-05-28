/**
 * Reports which integration markdown files need re-verification after a rotki
 * release, by diffing rotki source paths between two git refs and matching them
 * against scripts/integrations-meta.json.
 *
 * Usage:
 *   pnpm tsx scripts/integrations-changed.ts <rotki-repo-path> <old-tag> <new-tag>
 *
 * Example:
 *   pnpm tsx scripts/integrations-changed.ts ../../rotki v1.43.1 v1.44.0
 *
 * Output sections:
 *   1. Modified slugs   - existing md files whose backing rotki paths changed
 *   2. Added (uncovered) - new rotki paths not matched by any slug's globs
 *   3. Stale globs      - slug globs that match zero files in the new tag
 *   4. Premium changed  - premium gating files touched (re-check ctaPlan)
 *   5. Meta ↔ all.json drift - slugs only in one or the other
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { integrationSlug } from '../app/utils/integration-slug';

interface Meta {
  lastVerifiedRotkiTag: string;
  premiumPaths: string[];
  slugs: Record<string, string[]>;
  reviewedSlugs: string[];
}

interface AllJson {
  blockchains: Array<{ label: string }>;
  exchanges: Array<{ label: string }>;
  protocols: Array<{ label: string }>;
}

const ROOT = path.resolve(import.meta.dirname, '..');
const META_PATH = path.join(ROOT, 'scripts/integrations-meta.json');
const ALL_JSON_PATH = path.join(ROOT, 'public/integrations/all.json');
const CONTENT_DIR = path.join(ROOT, 'content/integrations');

function usage(): never {
  console.error('Usage: pnpm tsx scripts/integrations-changed.ts <rotki-repo-path> <old-tag> <new-tag>');
  process.exit(2);
}

const [rotkiArgRaw, oldTagRaw, newTagRaw] = process.argv.slice(2);
if (!rotkiArgRaw || !oldTagRaw || !newTagRaw)
  usage();
assert(rotkiArgRaw, 'usage() should have exited on missing args');
assert(oldTagRaw, 'usage() should have exited on missing args');
assert(newTagRaw, 'usage() should have exited on missing args');

const rotkiArg: string = rotkiArgRaw;
const oldTag: string = oldTagRaw;
const newTag: string = newTagRaw;
const rotkiPath = path.resolve(rotkiArg);

function git(args: string[]): string {
  return execFileSync('git', ['-C', rotkiPath, ...args], { encoding: 'utf8' });
}

function diffPaths(filter: string): string[] {
  const out = git(['diff', '--name-only', `--diff-filter=${filter}`, oldTag, newTag, '--', 'rotkehlchen/']);
  return out.split('\n').filter(Boolean);
}

function lsTree(ref: string): Set<string> {
  const out = git(['ls-tree', '-r', '--name-only', ref, 'rotkehlchen/']);
  return new Set(out.split('\n').filter(Boolean));
}

function globToRegExp(glob: string): RegExp {
  // POSIX glob to RegExp. Supports ** (any path), * (no slash), ? (one char).
  // We use a unique placeholder so the single-star pass doesn't eat double-stars.
  const re = glob
    .replace(/[$()+.[\\\]^{|}]/g, '\\$&')
    .replace(/\*\*/g, '__DOUBLE_STAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/__DOUBLE_STAR__/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${re}$`);
}

function matchAny(path: string, globs: string[]): boolean {
  return globs.some(g => globToRegExp(g).test(path));
}

const meta: Meta = JSON.parse(readFileSync(META_PATH, 'utf8'));

const changed = [...diffPaths('M'), ...diffPaths('A'), ...diffPaths('D'), ...diffPaths('R')];
const added = diffPaths('A');

// 1. Modified slugs
const affectedSlugs = new Map<string, string[]>();
for (const filePath of changed) {
  for (const [slug, globs] of Object.entries(meta.slugs)) {
    if (matchAny(filePath, globs)) {
      const list = affectedSlugs.get(slug) ?? [];
      list.push(filePath);
      affectedSlugs.set(slug, list);
    }
  }
}

// 2. Added paths uncovered by any slug
const allGlobs = Object.values(meta.slugs).flat();
const uncoveredAdditions = added.filter(p => !matchAny(p, allGlobs) && !matchAny(p, meta.premiumPaths));

// New chain dirs (top-level addition under rotkehlchen/chain/)
const newChainDirs = new Set<string>();
for (const p of added) {
  const m = p.match(/^rotkehlchen\/chain\/([^/]+)\//);
  if (!m)
    continue;
  const chain = m[1];
  assert(chain, 'regex captured group 1 should be defined when the match succeeds');
  if (!meta.slugs[chain] && !allGlobs.some(g => globToRegExp(g).test(`rotkehlchen/chain/${chain}/x`)))
    newChainDirs.add(chain);
}

// 3. Stale globs (resolve against new tag)
const newTree = lsTree(newTag);
const staleGlobs: Array<{ slug: string; glob: string }> = [];
for (const [slug, globs] of Object.entries(meta.slugs)) {
  for (const glob of globs) {
    const re = globToRegExp(glob);
    let matched = false;
    for (const p of newTree) {
      if (re.test(p)) {
        matched = true;
        break;
      }
    }
    if (!matched)
      staleGlobs.push({ slug, glob });
  }
}

// 4. Premium changes
const premiumChanged = changed.filter(p => matchAny(p, meta.premiumPaths));

// Output
console.log(`\nDiffing rotki ${oldTag} → ${newTag}\n${'='.repeat(60)}\n`);

console.log('=== 1. Modified slugs (re-verify existing md) ===');
if (affectedSlugs.size === 0) {
  console.log('  (none)');
}
else {
  for (const [slug, paths] of [...affectedSlugs].sort()) {
    const marker = meta.reviewedSlugs.includes(slug) ? '✓' : ' ';
    console.log(`  ${marker} ${slug}`);
    for (const p of paths.slice(0, 3)) console.log(`      ${p}`);
    if (paths.length > 3)
      console.log(`      ... +${paths.length - 3} more`);
  }
}

console.log('\n=== 2. Added paths uncovered by any slug (new md or new glob needed) ===');
if (uncoveredAdditions.length === 0) {
  console.log('  (none)');
}
else {
  for (const p of uncoveredAdditions.slice(0, 50)) console.log(`  + ${p}`);
  if (uncoveredAdditions.length > 50)
    console.log(`  ... +${uncoveredAdditions.length - 50} more`);
}
if (newChainDirs.size > 0) {
  console.log('\n  New chain directories (likely need new blockchain md files):');
  for (const d of newChainDirs) console.log(`  + rotkehlchen/chain/${d}/`);
}

console.log('\n=== 3. Stale globs (matched zero files at new tag) ===');
if (staleGlobs.length === 0) {
  console.log('  (none)');
}
else {
  for (const { slug, glob } of staleGlobs) console.log(`  ${slug}  ${glob}`);
}

console.log('\n=== 4. Premium gating changes (re-check ctaPlan across all files) ===');
if (premiumChanged.length === 0) {
  console.log('  (none)');
}
else {
  for (const p of premiumChanged) console.log(`  ! ${p}`);
}

// 5. Meta ↔ md files ↔ all.json drift
const mdSlugs = new Set(
  readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .map(f => f.replace(/\.md$/, '')),
);
const metaSlugs = new Set(Object.keys(meta.slugs));
const all: AllJson = JSON.parse(readFileSync(ALL_JSON_PATH, 'utf8'));
const allJsonSlugs = new Set<string>();
for (const item of [...all.blockchains, ...all.exchanges, ...all.protocols]) {
  const s = integrationSlug(item.label);
  if (s)
    allJsonSlugs.add(s);
}

const inMetaNotInMd = [...metaSlugs].filter(s => !mdSlugs.has(s)).sort();
const inMdNotInMeta = [...mdSlugs].filter(s => !metaSlugs.has(s)).sort();
const inAllNotInMd = [...allJsonSlugs].filter(s => !mdSlugs.has(s)).sort();

console.log('\n=== 5. Drift checks ===');

console.log('  Meta ↔ md files:');
if (inMetaNotInMd.length === 0 && inMdNotInMeta.length === 0) {
  console.log('    (in sync)');
}
else {
  for (const s of inMetaNotInMd) console.log(`    - ${s}  (meta entry has no md file - delete from meta or restore md)`);
  for (const s of inMdNotInMeta) console.log(`    + ${s}  (md file has no meta entry - add globs)`);
}

console.log('  all.json → md files (new integrations rotki added but no md yet):');
if (inAllNotInMd.length === 0) {
  console.log('    (none - run pnpm gen:integration-stubs if any appear)');
}
else {
  // Filter out slug collisions: all.json labels that collide with an existing md slug
  // by first-word match are deduped by gen:integration-stubs and won't get their own file.
  const trulyMissing = inAllNotInMd.filter((s) => {
    const firstSegment = s.split('-')[0];
    assert(firstSegment, 'String.split always returns at least one element');
    return !mdSlugs.has(firstSegment);
  });
  if (trulyMissing.length === 0) {
    console.log('    (all collisions - deduped by gen:integration-stubs)');
  }
  else {
    for (const s of trulyMissing) console.log(`    + ${s}  (run pnpm gen:integration-stubs)`);
  }
}

const driftExit = inMetaNotInMd.length + inMdNotInMeta.length + inAllNotInMd.filter((s) => {
  const firstSegment = s.split('-')[0]!;
  return !mdSlugs.has(firstSegment);
}).length;

const exitCode = (affectedSlugs.size > 0 || uncoveredAdditions.length > 0 || premiumChanged.length > 0 || driftExit > 0) ? 1 : 0;
process.exit(exitCode);

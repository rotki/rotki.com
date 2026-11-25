#!/usr/bin/env node

/**
 * Prints the Lighthouse CI results in `.lighthouseci/` as a Markdown table: the median run of each
 * page with its category scores, LCP, TBT and CLS. CI appends it to the job summary.
 */

import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

const MANIFEST = '.lighthouseci/manifest.json';

if (!existsSync(MANIFEST)) {
  console.log('## 🔦 Lighthouse\n\n_No report produced (collection failed, see the job log)._');
  process.exit(0);
}

const runs = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const medians = runs.filter(run => run.isRepresentativeRun);
const runsPerPage = Math.round(runs.length / (medians.length || 1));
const percent = value => `${Math.round(value * 100)}`;
let benchmarkIndex;

const rows = medians.map((run) => {
  const scores = run.summary;
  let lcp = '-';
  let tbt = '-';
  let cls = '-';
  try {
    const report = JSON.parse(readFileSync(run.jsonPath, 'utf8'));
    const audits = report.audits;
    lcp = `${(audits['largest-contentful-paint'].numericValue / 1000).toFixed(2)} s`;
    tbt = `${Math.round(audits['total-blocking-time'].numericValue)} ms`;
    cls = audits['cumulative-layout-shift'].numericValue.toFixed(3);
    benchmarkIndex ??= Math.round(report.environment.benchmarkIndex);
  }
  catch {
    // The scores alone still go in the table.
  }
  let page = run.url;
  try {
    page = new URL(run.url).pathname;
  }
  catch {
    // Keep the raw URL.
  }
  return `| \`${page}\` | ${percent(scores.performance)} | ${percent(scores.accessibility)} | ${percent(scores['best-practices'])} | ${percent(scores.seo)} | ${lcp} | ${tbt} | ${cls} |`;
});

console.log('## 🔦 Lighthouse (report-only)\n');
console.log('| Page | Perf | A11y | BP | SEO | LCP | TBT | CLS |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- |');
for (const row of rows)
  console.log(row);
if (benchmarkIndex !== undefined)
  console.log(`\n_CPU benchmarkIndex: ${benchmarkIndex}. Higher means a faster, less busy machine; values near 2000 mean a slow run and pessimistic scores._`);
console.log(`\n_Median of ${runsPerPage} run(s) per page._`);

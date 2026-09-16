import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createCoverageMap, type FileCoverage } from '@vitest/istanbul-lib-coverage';
import { cacheDirectory, reportDirectory, repositoryRoot } from './coverage';

/** One arm of a branch in lcov terms: the branch's line, its index in the file (block) and the arm. */
interface BranchRecord {
  line: number;
  block: string;
  arm: number;
  taken: number;
}

/** What a unit report says about a file: its executable lines and the identity of its branch arms. */
interface UnitFile {
  lines: Set<number>;
  branchLines: Set<number>;
  branchArms: Set<string>;
}

/** Line and branch records written for one file. */
interface FileRecords {
  lines: [line: number, hits: number][];
  branches: BranchRecord[];
}

/**
 * Unit coverage reports of the packages the e2e report covers.
 *
 * @remarks
 * Vitest lists every source file in them, tested or not, so they say which lines of each file are
 * code. `pnpm coverage` has to run before the e2e coverage run for them to exist.
 */
const UNIT_REPORTS = [
  'packages/website/coverage/lcov.info',
  'packages/sigil/coverage/lcov.info',
  'packages/card-payment-common/coverage/lcov.info',
];

function armKey(line: number, block: string, arm: number): string {
  return `${line},${block},${arm}`;
}

/** Adds one `DA` or `BRDA` record of a unit report to the file it belongs to; other records are ignored. */
function addUnitRecord(file: UnitFile, record: string): void {
  if (record.startsWith('DA:')) {
    file.lines.add(Number.parseInt(record.slice(3), 10));
    return;
  }
  if (record.startsWith('BRDA:')) {
    const [line = '', block = '', arm = ''] = record.slice(5).split(',');
    file.branchLines.add(Number.parseInt(line, 10));
    file.branchArms.add(armKey(Number.parseInt(line, 10), block, Number.parseInt(arm, 10)));
  }
}

/** Reads each file's lines and branch arms from the unit reports, keyed by repository-relative path. */
async function readUnitReports(): Promise<Map<string, UnitFile>> {
  const files = new Map<string, UnitFile>();
  for (const report of UNIT_REPORTS) {
    const content = await readFile(path.join(repositoryRoot, report), 'utf8').catch(() => '');
    let current: UnitFile | undefined;
    for (const record of content.split('\n')) {
      if (record.startsWith('SF:')) {
        current = { branchArms: new Set(), branchLines: new Set(), lines: new Set() };
        files.set(record.slice(3), current);
      }
      else if (current) {
        addUnitRecord(current, record);
      }
    }
  }
  return files;
}

/** Branch arms the way Vitest's lcov writer numbers them, so they compare equal to the unit report's. */
function branchRecordsOf(coverage: FileCoverage): BranchRecord[] {
  return Object.entries(coverage.b).flatMap(([block, counts]) => {
    const branch = coverage.branchMap[block];
    if (!branch)
      return [];
    return counts.map((taken, arm) => ({ arm, block, line: branch.loc.start.line, taken }));
  });
}

/**
 * Keeps the part of a file's e2e coverage that means the same thing as the unit report's.
 *
 * @remarks
 * Both reports come from the same client compilation and the same V8-to-istanbul conversion (see
 * `tests/coverage-provider.ts` for the unit side), so they mostly agree. The Nuxt dev server adds
 * transforms the unit run does not have, such as the `definePageMeta` macro, whose coarse source maps
 * put e2e statements and branches on imports, type declarations or past the end of the file. Codecov
 * merges reports line by line and matches branches by their position in the file, so:
 *
 * - lines are kept only where the unit report has a line, with e2e's own hit counts;
 * - branches are kept only when the file's branch arms are exactly the unit report's, so the same
 *   position means the same branch;
 * - otherwise no branches are sent, and no hit on a line the unit report has branches for, since
 *   Codecov reads a plain hit merged with a partial line as every branch taken.
 */
function recordsOnUnitReport(coverage: FileCoverage, unit: UnitFile): FileRecords {
  const branches = branchRecordsOf(coverage);
  const sameBranches = branches.length === unit.branchArms.size
    && branches.every(({ arm, block, line }) => unit.branchArms.has(armKey(line, block, arm)));
  const lines = Object.entries(coverage.getLineCoverage())
    .map(([line, hits]): [number, number] => [Number(line), hits])
    .filter(([line]) => unit.lines.has(line) && (sameBranches || !unit.branchLines.has(line)));
  return { branches: sameBranches ? branches : [], lines };
}

function ownRecords(coverage: FileCoverage): FileRecords {
  return {
    branches: branchRecordsOf(coverage),
    lines: Object.entries(coverage.getLineCoverage()).map(([line, hits]) => [Number(line), hits]),
  };
}

function toLcovRecord(file: string, { branches, lines }: FileRecords): string {
  const sorted = [...lines].sort(([a], [b]) => a - b);
  return [
    `SF:${file}`,
    ...sorted.map(([line, hits]) => `DA:${line},${hits}`),
    `LF:${sorted.length}`,
    `LH:${sorted.filter(([, hits]) => hits > 0).length}`,
    ...branches.map(({ arm, block, line, taken }) => `BRDA:${line},${block},${arm},${taken}`),
    `BRF:${branches.length}`,
    `BRH:${branches.filter(({ taken }) => taken > 0).length}`,
    'end_of_record',
  ].join('\n');
}

/**
 * Merges every cached test into `tests/e2e/coverage/lcov.info` and prints a summary.
 *
 * @remarks
 * Paths are relative to the repository root, like the unit reports. Without unit reports the e2e
 * coverage is written as collected, which will not line up with them on Codecov.
 */
export async function writeCoverageReport(): Promise<void> {
  const coverageMap = createCoverageMap();
  const cached = await readdir(cacheDirectory).catch(() => []);
  for (const file of cached)
    coverageMap.merge(JSON.parse(await readFile(path.join(cacheDirectory, file), 'utf8')));

  const unitReports = await readUnitReports();
  if (unitReports.size === 0)
    console.warn('[e2e coverage] No unit coverage reports found; run `pnpm coverage` first. Writing the e2e coverage as collected, which will not line up with the unit report on Codecov.');

  const records: string[] = [];
  let lines = 0;
  let linesHit = 0;
  let filesWithBranches = 0;
  for (const absolute of coverageMap.files()) {
    const file = path.relative(repositoryRoot, absolute);
    const coverage = coverageMap.fileCoverageFor(absolute);
    const unit = unitReports.get(file);
    const fileRecords = unit ? recordsOnUnitReport(coverage, unit) : ownRecords(coverage);
    lines += fileRecords.lines.length;
    linesHit += fileRecords.lines.filter(([, hits]) => hits > 0).length;
    if (fileRecords.branches.length > 0)
      filesWithBranches += 1;
    records.push(toLcovRecord(file, fileRecords));
  }

  await writeFile(path.join(reportDirectory, 'lcov.info'), `${records.join('\n')}\n`);
  const percent = lines === 0 ? 0 : (linesHit / lines) * 100;
  process.stdout.write(`[e2e coverage] ${coverageMap.files().length} files, lines ${linesHit}/${lines} (${percent.toFixed(2)}%), branch data kept for ${filesWithBranches} files\n`);
}

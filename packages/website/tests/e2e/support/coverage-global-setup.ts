import { resetCoverage } from './coverage';
import { writeCoverageReport } from './coverage-report';

/** Starts every coverage run from an empty cache and writes the merged report when it ends. */
export default async function globalSetup(): Promise<() => Promise<void>> {
  await resetCoverage();
  return writeCoverageReport;
}

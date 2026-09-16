import { test as base } from '@playwright/test';
import { isCoverageEnabled, startCoverage, stopCoverage } from './coverage';

/**
 * Playwright `test` for every e2e spec; import it instead of the one from `@playwright/test`.
 *
 * @remarks
 * With `E2E_COVERAGE=true` it records the JS coverage of each test's page, which the global setup
 * turns into one lcov report once the run ends. Without it the fixture does nothing.
 */
export const test = base.extend<{ coverage: undefined }>({
  coverage: [async ({ page }, use, testInfo) => {
    if (!isCoverageEnabled()) {
      await use(undefined);
      return;
    }

    await startCoverage(page);
    await use(undefined);
    await stopCoverage(page, `${testInfo.testId}-${testInfo.repeatEachIndex}-${testInfo.retry}`);
  }, { auto: true }],
});

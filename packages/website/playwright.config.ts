import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';
import { isCoverageEnabled } from './tests/e2e/support/coverage';
import { envOrDefault, mockApiPort, nuxtPort, goPort as port } from './tests/e2e/support/ports';

const baseURL = envOrDefault('BASE_URL', `http://localhost:${port}`);
const mockApiUrl = `http://127.0.0.1:${mockApiPort}`;

// Use system Chromium if PLAYWRIGHT_CHROMIUM_PATH is set (e.g., on Arch Linux)
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: './tests/e2e/specs',
  testMatch: '**/*.spec.ts',
  globalSetup: [
    './tests/e2e/support/warm-up-global-setup.ts',
    // Writes tests/e2e/coverage/lcov.info once every test has run.
    ...(isCoverageEnabled() ? ['./tests/e2e/support/coverage-global-setup.ts'] : []),
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Tests share no state; more than two would starve the dev servers on the runner's four cores.
  workers: process.env.CI ? 2 : 4,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: process.env.CI ? 'on-first-retry' : 'off',
    screenshot: process.env.CI ? 'only-on-failure' : 'off',
    viewport: { width: 1280, height: 720 },
    ...(chromiumPath && {
      launchOptions: {
        executablePath: chromiumPath,
        args: ['--headless=new'],
      },
    }),
  },
  outputDir: './tests/e2e/test-results',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    /* Mock API server, starts first. Bound to 127.0.0.1 and reached through that address: on its
       own nitro listens on ::1 only, and the Go proxy dials localhost as 127.0.0.1, so every
       proxied /webapi call failed with a 502. */
    {
      command: `pnpm --filter e2e-mock-api exec nitro dev --host 127.0.0.1 --port ${mockApiPort}`,
      env: {
        ALLOWED_ORIGIN: `http://localhost:${port}`,
      },
      url: `${mockApiUrl}/webapi/2/available-tiers`,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    // Nuxt dev server, frontend only, on its own port so a running dev stack is never reused
    {
      command: `pnpm exec nuxi dev --host 0.0.0.0 --port ${nuxtPort}`,
      env: {
        TEST: 'true',
        NUXT_PUBLIC_BASE_URL: `http://localhost:${port}`,
        // The plans the pages are built with come from the mock API, like every other request here
        TIERS_SNAPSHOT_URL: mockApiUrl,
      },
      url: `http://localhost:${nuxtPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    /* Go backend: proxies pages to Nuxt, /webapi to mock API. Built first and run as a binary: `go run`
       compiles into a /tmp/go-build* directory it only removes on a clean exit, and a web server is
       always stopped by a signal, so every run left one behind. */
    {
      command: 'make -C ../../backend build && exec ../../backend/server',
      env: {
        DEV_MODE: 'true',
        PORT: port,
        NUXT_DEV_URL: `http://localhost:${nuxtPort}`,
        PROXY_DOMAIN: `127.0.0.1:${mockApiPort}`,
        PROXY_INSECURE: 'true',
        BASE_URL: `http://localhost:${port}`,
        LOG_LEVEL: 'warn',
      },
      url: `http://localhost:${port}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});

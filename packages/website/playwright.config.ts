import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

const port = process.env.PORT || '48123';
const mockApiPort = '9999';
const baseURL = process.env.BASE_URL || `http://localhost:${port}`;

// Use system Chromium if PLAYWRIGHT_CHROMIUM_PATH is set (e.g., on Arch Linux)
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: './tests/e2e/specs',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
    // Mock API server - starts first
    {
      command: 'pnpm --filter e2e-mock-api dev',
      env: {
        ALLOWED_ORIGIN: `http://localhost:${port}`,
      },
      url: `http://localhost:${mockApiPort}/webapi/2/available-tiers`,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    // Main Nuxt app - uses mock API server as backend
    {
      command: 'pnpm dev',
      env: {
        NUXT_PORT: port,
        PORT: port,
        TEST: 'true',
        NUXT_PUBLIC_BASE_URL: `http://localhost:${port}`,
        // Configure devProxy to use mock server (http, not https)
        PROXY_DOMAIN: `localhost:${mockApiPort}`,
        PROXY_INSECURE: 'true',
      },
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});

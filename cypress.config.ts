import { defineConfig } from 'cypress';

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 720,
  e2e: {
    baseUrl: 'http://localhost:3000',
    fixturesFolder: 'tests/e2e/fixtures',
    specPattern: `tests/e2e/specs/**/*.spec.cy.ts`,
    screenshotsFolder: 'tests/e2e/screenshots',
    supportFile: 'tests/e2e/support/e2e.ts',
    videosFolder: 'tests/e2e/videos',
    downloadsFolder: 'tests/e2e/downloads',
    testIsolation: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
  },
  defaultCommandTimeout: 60000,
  responseTimeout: 60000,
  pageLoadTimeout: 300000,
});

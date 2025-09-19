import { defineConfig } from 'cypress';

export default defineConfig({
  defaultCommandTimeout: 60000,
  e2e: {
    baseUrl: 'http://localhost:3000',
    downloadsFolder: 'tests/e2e/downloads',
    fixturesFolder: 'tests/e2e/fixtures',
    screenshotsFolder: 'tests/e2e/screenshots',
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
    specPattern: `tests/e2e/specs/**/*.spec.cy.ts`,
    supportFile: 'tests/e2e/support/e2e.ts',
    testIsolation: false,
    videosFolder: 'tests/e2e/videos',
  },
  pageLoadTimeout: 300000,
  responseTimeout: 60000,
  viewportHeight: 720,
  viewportWidth: 1280,
});

import { defineVitestConfig } from 'nuxt-vitest/config';

export default defineVitestConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    env: {
      BASE_URL: process.env.BACKEND_URL || 'https://rotki.com/webapi',
    },
  },
  plugins: [],
});

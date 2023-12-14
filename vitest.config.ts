import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    globals: true,
    environment: 'nuxt',
    env: {
      BASE_URL: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      BACKEND_URL: process.env.NUXT_PUBLIC_BACKEND_URL || 'https://rotki.com',
      NODE_ENV: 'test',
    },
    setupFiles: ['./tests/setup.ts'],
  },
  plugins: [],
});

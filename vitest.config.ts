import process from 'node:process';
import { defineVitestConfig } from '@nuxt/test-utils/config';
import { configDefaults } from 'vitest/config';

export default defineVitestConfig({
  plugins: [],
  test: {
    env: {
      BACKEND_URL: process.env.NUXT_PUBLIC_BACKEND_URL || 'https://rotki.com',
      BASE_URL: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      NODE_ENV: 'test',
    },
    environment: 'nuxt',
    exclude: [
      ...configDefaults.exclude,
      '.data/**',
    ],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});

import process from 'node:process';
import { defineVitestConfig } from '@nuxt/test-utils/config';
import { configDefaults } from 'vitest/config';

export default defineVitestConfig({
  plugins: [],
  test: {
    coverage: {
      exclude: ['.nuxt/**', 'tests/**', '**/*.test.ts', '**/*.spec.ts'],
      include: ['app/**'],
      provider: 'v8',
      reporter: ['json', 'lcov'],
      reportsDirectory: 'coverage',
    },
    env: {
      BACKEND_URL: process.env.NUXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
      BASE_URL: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      NODE_ENV: 'test',
    },
    environment: 'nuxt',
    exclude: [
      ...configDefaults.exclude,
      '.data/**',
      'tests/e2e/**',
    ],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});

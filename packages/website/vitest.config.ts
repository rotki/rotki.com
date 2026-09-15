import process from 'node:process';
import { defineVitestConfig } from '@nuxt/test-utils/config';
import { configDefaults } from 'vitest/config';

/** Reads an environment variable, treating an empty value the same as an unset one. */
function envOrDefault(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

export default defineVitestConfig({
  plugins: [],
  test: {
    coverage: {
      exclude: ['.nuxt/**', 'tests/**', '**/*.test.ts', '**/*.spec.ts'],
      include: ['app/**/*.{ts,vue}'],
      provider: 'v8',
      reporter: ['json', 'lcov'],
      reportsDirectory: 'coverage',
    },
    env: {
      BACKEND_URL: envOrDefault('NUXT_PUBLIC_BACKEND_URL', 'http://localhost:3000'),
      BASE_URL: envOrDefault('NUXT_PUBLIC_BASE_URL', 'http://localhost:3000'),
      NODE_ENV: 'test',
    },
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },
    exclude: [
      ...configDefaults.exclude,
      '.data/**',
      'tests/e2e/**',
    ],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});

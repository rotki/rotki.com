import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { defineVitestConfig } from '@nuxt/test-utils/config';
import { configDefaults } from 'vitest/config';

/** Reads an environment variable, treating an empty value the same as an unset one. */
function envOrDefault(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

/* lcov paths are written relative to the repository root, the same as the e2e report, so Codecov
   merges both onto the same files without guessing. */
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineVitestConfig({
  plugins: [],
  test: {
    coverage: {
      // The V8 provider, fixed to compile untested files for the client under the `nuxt` environment.
      customProviderModule: './tests/coverage-provider.ts',
      exclude: ['.nuxt/**', 'tests/**', '**/*.test.ts', '**/*.spec.ts'],
      include: ['app/**/*.{ts,vue}'],
      provider: 'custom',
      reporter: [['lcov', { projectRoot: repositoryRoot }]],
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

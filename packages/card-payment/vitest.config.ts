import { fileURLToPath, URL } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

/* lcov paths are written relative to the repository root, so Codecov can tell this package's
   `src/` apart from the other packages' without guessing. */
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

export default mergeConfig(viteConfig, defineConfig({
  test: {
    coverage: {
      exclude: ['**/*.spec.ts'],
      include: ['src/**/*.{ts,vue}'],
      provider: 'v8',
      reporter: [['lcov', { projectRoot: repositoryRoot }]],
      reportsDirectory: 'coverage',
    },
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts'],
  },
}));

import pluginNuxt from '@nuxt/eslint-plugin';
import rotki from '@rotki/eslint-config';

export default rotki({
  vue: true,
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  stylistic: true,
  formatters: true,
  rotki: {
    overrides: {
      '@rotki/consistent-ref-type-annotation': ['error'],
    },
  },
}, {
  files: ['packages/website/**/*.{vue,ts,js}'],
  plugins: {
    nuxt: pluginNuxt,
  },
  rules: {
    // No runtime context (composables, `this`, `await`) in the build-time `definePageMeta` chunk.
    'nuxt/no-page-meta-runtime-values': 'error',
    // Prefer `import.meta.client/server/...` over the legacy `process.*` flags.
    'nuxt/prefer-import-meta': 'error',
  },
}, {
  files: ['packages/website/nuxt.config.ts'],
  plugins: {
    nuxt: pluginNuxt,
  },
  rules: {
    'nuxt/no-nuxt-config-test-key': 'error',
    'nuxt/nuxt-config-keys-order': 'error',
  },
}, {
  files: [
    'packages/website/vue-shims.d.ts',
    'packages/website/modules/**/*.ts',
    'packages/website/server/**/*.ts',
    'packages/website/app/middleware/**/*.ts',
    'packages/website/app/plugins/**/*.ts',
    'packages/website/app/types/recaptcha.d.ts',
    'packages/website/tests/coverage-provider.ts',
    'packages/website/tests/e2e/mock-api/routes/**/*.ts',
    'packages/website/tests/e2e/support/coverage-global-setup.ts',
  ],
  rules: {
    'import/no-default-export': 'off',
  },
}, {
  files: [
    'packages/website/content/testimonials/**/*',
  ],
  rules: {
    'unicorn/filename-case': 'off',
  },
}, {
  /* Content docs (legal pages, job posts) render inside layouts that already provide the
     page <h1>, so they start at h2/h5 and skip levels on purpose. */
  files: [
    'packages/website/content/**/*.md',
  ],
  rules: {
    'markdown/heading-increment': 'off',
  },
}, {
  files: [
    'packages/website/app/utils/**/*',
    'packages/website/shared/utils/**/*',
  ],
  rules: {
    'node/prefer-global/process': 'off',
  },
}, {
  files: ['**/*.md/**'],
  rules: {
    '@rotki/consistent-ref-type-annotation': 'off',
  },
}, {
  files: ['**/*.yml', '**/*.yaml'],
  rules: {
    '@stylistic/spaced-comment': 'off',
  },
}, {
  /* Vite 8 loads configs natively and warns on extensionless relative imports, which
     `@rotki/no-dot-ts-imports` would autofix straight back off. Off for config files only. */
  files: ['**/vite.config.ts', '**/vitest.config.ts'],
  rules: {
    '@rotki/no-dot-ts-imports': 'off',
  },
}, {
  ignores: [
    '**/dist/**',
    '**/node_modules/**',
    '**/.nuxt/**',
    '**/.output/**',
    '**/coverage/**',
    '**/playwright-report/**',
    '**/test-results/**',
  ],
});

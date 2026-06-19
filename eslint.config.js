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
    // Disallow runtime context (composables, `this`, `await`) inside the build-time
    // `definePageMeta` chunk, which runs before component setup.
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
    'packages/website/tests/e2e/mock-api/routes/**/*.ts',
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
  // Content docs (legal pages, job posts) are rendered inside layouts that already
  // provide the page <h1>, so they intentionally start at h2/h5 and skip levels.
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

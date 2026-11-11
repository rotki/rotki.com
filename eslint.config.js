import pluginNuxt from '@nuxt/eslint-plugin';
import rotki from '@rotki/eslint-config';

export default rotki({
  vue: true,
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  stylistic: true,
  formatters: true,
  slop: true,
  sonarjs: { cognitiveComplexity: 15 },
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
  /* Test ids are static, so a search finds every element a test can reach. Anything variable
     goes on `data-key`, and tests select `[data-testid=row][data-key=value]`. */
  files: ['**/*.vue'],
  rules: {
    'vue/no-restricted-static-attribute': ['error', {
      key: 'data-cy',
      message: 'Use `data-testid`. `data-cy` is a Cypress-era leftover.',
    }],
    'vue/no-restricted-v-bind': ['error', {
      argument: 'data-testid',
      message: 'Keep `data-testid` static and put the variable part on `data-key`.',
    }, {
      argument: 'data-cy',
      message: 'Use `data-testid`. `data-cy` is a Cypress-era leftover.',
    }],
  },
}, {
  // The template rules cannot see selector strings in tests.
  files: ['**/*.spec.ts', 'packages/website/tests/**/*.ts'],
  rules: {
    'no-restricted-syntax': ['error', {
      message: 'Query on `data-testid`. `data-cy` is a Cypress-era leftover.',
      selector: 'Literal[value=/data-cy/]',
    }, {
      message: 'Query on `data-testid`. `data-cy` is a Cypress-era leftover.',
      selector: 'TemplateElement[value.raw=/data-cy/]',
    }],
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
    'packages/website/i18n/locales/*.ts',
    'packages/website/tests/coverage-provider.ts',
    'packages/website/tests/e2e/mock-api/routes/**/*.ts',
    'packages/website/tests/e2e/support/coverage-global-setup.ts',
    'packages/website/tests/e2e/support/warm-up-global-setup.ts',
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
  /* The shared checkout packages are bundled into the card payment page, whose scripts are
     inventoried (scripts/check-card-bundle.mjs). Keep app frameworks, network clients, wallet
     stacks and payment SDKs in the apps. */
  files: [
    'packages/checkout-ui/**/*.{ts,vue}',
    'packages/card-payment-common/**/*.ts',
  ],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: [
          '#app',
          '#imports',
          '@nuxt/*',
          '@nuxtjs/*',
          '@wagmi/*',
          '@walletconnect/*',
          'braintree-web',
          'braintree-web/*',
          'nuxt',
          'nuxt/*',
          'ofetch',
          'pinia',
          'viem',
          'viem/*',
          'vue-i18n',
        ],
        message: 'Shared checkout code is bundled into the card payment page; keep this import in the app.',
      }],
    }],
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

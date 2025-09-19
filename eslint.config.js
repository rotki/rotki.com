import rotki from '@rotki/eslint-config';
import pluginNuxt from 'eslint-plugin-nuxt';

export default rotki({
  vue: true,
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  stylistic: true,
  formatters: true,
  rotki: {
    overrides: {
      '@rotki/consistent-ref-type-annotation': ['warn', { allowInference: true }],
    },
  },
}, {
  files: ['packages/website/**/*.{vue,ts,js}'],
  plugins: {
    nuxt: pluginNuxt,
  },
  rules: {
    ...pluginNuxt.configs.base.rules,
    ...pluginNuxt.configs.recommended.rules,
  },
}, {
  files: [
    'packages/website/vue-shims.d.ts',
    'packages/website/modules/**/*.ts',
    'packages/website/server/**/*.ts',
    'packages/website/middleware/**/*.ts',
    'packages/website/plugins/**/*.ts',
    'packages/website/types/recaptcha.d.ts',
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
  files: [
    'packages/website/utils/**/*',
  ],
  rules: {
    'node/prefer-global/process': 'off',
  },
}, {
  ignores: [
    '**/dist/**',
    '**/node_modules/**',
    '**/.nuxt/**',
    '**/.output/**',
    '**/coverage/**',
    '**/playwright-report/**',
  ],
});

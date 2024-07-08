import rotki from '@rotki/eslint-config';
import pluginNuxt from 'eslint-plugin-nuxt';

export default rotki({
  vue: true,
  typescript: {
    tsconfigPath: './.nuxt/tsconfig.json',
  },
  stylistic: true,
  formatters: true,
  rotki: {
    overrides: {
      '@rotki/consistent-ref-type-annotation': ['warn', { allowInference: true }],
    },
  },
}, {
  files: ['**/*.ts'],
  rules: {
    'perfectionist/sort-objects': 'error',
  },
}, {
  plugins: {
    nuxt: pluginNuxt,
  },
  rules: {
    ...pluginNuxt.configs.base.rules,
    ...pluginNuxt.configs.recommended.rules,
  },
}, {
  files: [
    'vue-shims.d.ts',
    'modules/**/*.ts',
    'server/**/*.ts',
    'middleware/**/*.ts',
    'plugins/**/*.ts',
    'types/recaptcha.d.ts',
  ],
  rules: {
    'import/no-default-export': 'off',
  },
}, {
  files: [
    'content/testimonials/**/*',
  ],
  rules: {
    'unicorn/filename-case': 'off',
  },
}, {
  files: [
    'utils/**/*',
  ],
  rules: {
    'node/prefer-global/process': 'off',
  },
});

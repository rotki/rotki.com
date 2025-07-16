import process from 'node:process';
import rotki from '@rotki/eslint-config';
import pluginNuxt from 'eslint-plugin-nuxt';

// TODO: at the moment the eslint plugin seems incompatible. Enable when ready.
const enableVue18n = !!process.env.ENABLE_VUE_I18N_LINT;

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
  vueI18n: enableVue18n
    ? {
        src: '**',
        localesDirectory: 'i18n/locales',
        enableNoUnusedKeys: 'ci',
        overrides: {
          '@intlify/vue-i18n/no-raw-text': [
            'error',
            {
              ignoreText: ['€', '*', 'rotki', '+', ':'],
            },
          ],
        },
      }
    : false,
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

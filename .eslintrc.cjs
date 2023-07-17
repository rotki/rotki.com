process.env.ESLINT_TSCONFIG = '.nuxt/tsconfig.json';

module.exports = {
  extends: ['plugin:nuxt/recommended', '@rotki'],
  rules: {
    'vue/component-name-in-template-casing': [
      'error',
      'PascalCase',
      {
        registeredComponentsOnly: false,
        // components are only exported in kebab-case
        ignores: ['i18n-t'],
      },
    ],
  },
};

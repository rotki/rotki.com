module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-recommended-vue'],
  plugins: ['stylelint-order'],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'apply',
          'config',
          'layer',
          'responsive',
          'screen',
          'tailwind',
          'utility',
          'variants',
        ],
      },
    ],
    // Tailwind at-rule preludes are not CSS grammar. Keep `media` from the
    // stylelint-config-recommended default, since setting options replaces it.
    'at-rule-prelude-no-invalid': [
      true,
      {
        ignoreAtRules: [
          'apply',
          'config',
          'layer',
          'media',
          'responsive',
          'screen',
          'tailwind',
          'utility',
          'variants',
        ],
      },
    ],
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['theme'],
      },
    ],
    'import-notation': 'string',
    'no-descending-specificity': null,
  },
};

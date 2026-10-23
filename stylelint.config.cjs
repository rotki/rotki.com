/* Tailwind 4 at-rules. */
const tailwindAtRules = [
  'apply',
  'custom-variant',
  'layer',
  'plugin',
  'reference',
  'source',
  'theme',
  'utility',
  'variant',
];

module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-recommended-vue'],
  plugins: ['stylelint-order'],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: tailwindAtRules,
      },
    ],
    /* Tailwind at-rule preludes are not CSS grammar. `media` stays from the
       stylelint-config-recommended default, since setting options replaces it. */
    'at-rule-prelude-no-invalid': [
      true,
      {
        ignoreAtRules: [...tailwindAtRules, 'media'],
      },
    ],
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['theme', '--alpha', '--spacing'],
      },
    ],
    'import-notation': 'string',
    'no-descending-specificity': null,
  },
};

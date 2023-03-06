module.exports = {
  plugins: ['stylelint-scss', 'stylelint-order'],
  extends: ['stylelint-config-recommended-vue/scss'],
  overrides: [
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss',
    },
  ],
  rules: {
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          /apply/,
          /layer/,
          /tailwind/,
          /screen/,
          /if/,
          /else/,
          /return/,
          /function/,
          /debug/,
        ],
      },
    ],
    'no-descending-specificity': null,
    'scss/at-import-partial-extension': null,
  },
}

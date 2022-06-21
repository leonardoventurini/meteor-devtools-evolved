const { merge } = require('lodash')

module.exports = merge(require('@tstt/eslint-config/index.js'), {
  rules: {
    'global-require': 0,
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/no-inferrable-types': [
      2,
      {
        ignoreParameters: true,
        ignoreProperties: true,
      },
    ],
  },
  globals: { Meteor: 'readonly', i18n: 'readonly' },
})

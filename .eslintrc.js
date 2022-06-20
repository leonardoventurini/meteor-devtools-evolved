const { merge } = require('lodash')

module.exports = merge(require('@tstt/eslint-config/index.js'), {
 env: {
  browser: true,
  es2021: true,
 },
 extends: [
  'eslint:recommended',
  'plugin:react/recommended',
  'plugin:@typescript-eslint/recommended',
 ],
 parser: '@typescript-eslint/parser',
 parserOptions: {
  ecmaFeatures: {
   jsx: true,
  },
  ecmaVersion: 12,
  sourceType: 'module',
 },
 plugins: ['react', 'react-hooks', '@typescript-eslint'],
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

const { merge } = require('lodash')

module.exports = merge(require('@tstt/eslint-config/index.js'), {
  globals: { Meteor: 'readonly', i18n: 'readonly' },
})

const base = require('./base');
const path = require('path');

module.exports = base({
  watch: true,
  mode: 'development',
  devtool: 'inline-source-map',
});

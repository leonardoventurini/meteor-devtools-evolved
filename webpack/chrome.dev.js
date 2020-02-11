const base = require('./base');
const path = require('path');

module.exports = base({
  watch: true,

  mode: 'development',

  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, '../chrome/build/'),
  },

  devtool: 'inline-source-map',
});

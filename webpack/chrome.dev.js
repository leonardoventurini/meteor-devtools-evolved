const base = require('./base')

module.exports = base('chrome', {
  watch: true,
  mode: 'development',
  devtool: 'inline-source-map',
  stats: {
    modules: false,
  },
})

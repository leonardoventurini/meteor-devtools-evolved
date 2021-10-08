const base = require('./base')

module.exports = base({
  watch: true,
  mode: 'development',
  devtool: 'inline-source-map',
  stats: {
    modules: false,
  },
})

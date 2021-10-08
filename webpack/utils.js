const { resolve } = require('path')
const { toPairs } = require('lodash')

const getTypeScriptAliases = () => {
  const { paths } = require('../tsconfig').compilerOptions

  console.log(toPairs(paths))

  return toPairs(paths).reduce(
    (acc, [key, item]) => ({
      ...acc,
      [key.replace('/*', '')]: resolve(
        __dirname,
        '..',
        item[0].replace('/*', '').replace('*', ''),
      ),
    }),
    {},
  )
}

module.exports = { getTypeScriptAliases }

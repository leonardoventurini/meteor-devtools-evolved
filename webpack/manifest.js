const packageJson = require('../package.json')

/**
 * Keeps browser-store package metadata aligned with the canonical npm package
 * version, even when a source manifest was not manually updated.
 */
const transformManifest = content => {
  const manifest = JSON.parse(content.toString())
  manifest.version = packageJson.version

  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`)
}

module.exports = { transformManifest }

import { defineConfig } from 'wxt'
import { createManifest } from './src/Config/Manifest'

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  zip: {
    dotSources: true,
    includeSources: [
      '.yarnrc.yml',
      'LICENSE.md',
      'README.md',
      'package.json',
      'postcss.config.js',
      'public/**',
      'src/**',
      'tsconfig.json',
      'web-ext.config.ts',
      'wxt.config.ts',
      'yarn.lock',
    ],
  },
  manifest: ({ browser }) =>
    createManifest(browser === 'firefox' ? 'firefox' : 'chrome'),
})

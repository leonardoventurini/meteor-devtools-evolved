import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

type Manifest = {
  manifest_version: number
  version: string
  icons: Record<string, string>
  content_scripts: Array<{ matches: string[] }>
  host_permissions?: string[]
  permissions?: string[]
  web_accessible_resources?: Array<{ matches: string[] }>
  browser_specific_settings?: {
    gecko?: {
      id?: string
      strict_min_version?: string
      data_collection_permissions?: { required?: string[] }
    }
    gecko_android?: { strict_min_version?: string }
  }
}

const require = createRequire(import.meta.url)
const projectRoot = path.resolve(import.meta.dirname, '..')
const packageJson = require('../package.json') as { version: string }

const readManifest = (filename: string): Manifest =>
  JSON.parse(
    readFileSync(path.join(projectRoot, 'extension', filename), 'utf8'),
  ) as Manifest

const chromeManifest = readManifest('manifest-v3.json')
const firefoxManifest = readManifest('manifest-v2.json')
const webPageMatches = ['http://*/*', 'https://*/*']
const iconSizes = ['16', '32', '48', '128']
const analyticsOrigin = 'https://www.google-analytics.com/*'

describe('browser manifest contracts', () => {
  it('targets the current Chrome and Firefox manifest formats', () => {
    expect(chromeManifest.manifest_version).toBe(3)
    expect(firefoxManifest.manifest_version).toBe(2)
  })

  it('declares the published Firefox identity, compatibility floor, and no data collection', () => {
    expect(firefoxManifest.browser_specific_settings?.gecko).toEqual({
      id: '{bcb0685a-df42-43b8-969f-7aae4b2b262b}',
      strict_min_version: '140.0',
      data_collection_permissions: { required: ['none'] },
    })
    expect(
      firefoxManifest.browser_specific_settings?.gecko_android
        ?.strict_min_version,
    ).toBe('142.0')
  })

  it('limits injection to web pages and keeps Chrome resources in the same scope', () => {
    expect(chromeManifest.content_scripts[0].matches).toEqual(webPageMatches)
    expect(firefoxManifest.content_scripts[0].matches).toEqual(webPageMatches)
    expect(chromeManifest.web_accessible_resources?.[0].matches).toEqual(
      webPageMatches,
    )
  })

  it('uses the complete icon set in both browsers', () => {
    expect(Object.keys(chromeManifest.icons)).toEqual(iconSizes)
    expect(Object.keys(firefoxManifest.icons)).toEqual(iconSizes)
  })

  it('does not request retired analytics access or unnecessary tab metadata', () => {
    expect(chromeManifest.host_permissions).not.toContain(analyticsOrigin)
    expect(firefoxManifest.permissions).not.toContain(analyticsOrigin)
    expect(firefoxManifest.permissions).not.toContain('tabs')
  })

  it('generates the package version regardless of the source manifest version', () => {
    const { transformManifest } = require('../webpack/manifest') as {
      transformManifest: (content: Buffer) => Buffer
    }
    const source = Buffer.from('{"version":"0.0.0","name":"test"}')
    const transformed = JSON.parse(transformManifest(source).toString()) as {
      version: string
    }

    expect(transformed.version).toBe(packageJson.version)
  })
})

import { createManifest } from '../src/Config/Manifest'
import packageJson from '../package.json'
import { describe, expect, it } from 'vitest'

const chromeManifest = createManifest('chrome')
const firefoxManifest = createManifest('firefox')
const webPageMatches = ['http://*/*', 'https://*/*']
const iconSizes = ['16', '32', '48', '128']
const analyticsOrigin = 'https://www.google-analytics.com/*'

describe('browser manifest policy', () => {
  it('uses the package version for every browser', () => {
    expect(chromeManifest.version).toBe(packageJson.version)
    expect(firefoxManifest.version).toBe(packageJson.version)
  })

  it('declares the published Firefox identity, compatibility floors, and no data collection', () => {
    expect(firefoxManifest.browser_specific_settings.gecko).toEqual({
      id: '{bcb0685a-df42-43b8-969f-7aae4b2b262b}',
      strict_min_version: '140.0',
      data_collection_permissions: { required: ['none'] },
    })
    expect(
      firefoxManifest.browser_specific_settings.gecko_android
        .strict_min_version,
    ).toBe('142.0')
  })

  it('limits exposed resources to web pages', () => {
    expect(chromeManifest.web_accessible_resources[0].matches).toEqual(
      webPageMatches,
    )
    expect(firefoxManifest.web_accessible_resources[0].matches).toEqual(
      webPageMatches,
    )
  })

  it('uses the complete icon set in both browsers', () => {
    expect(Object.keys(chromeManifest.icons)).toEqual(iconSizes)
    expect(Object.keys(firefoxManifest.icons)).toEqual(iconSizes)
  })

  it('does not request retired analytics access or tab metadata', () => {
    expect(chromeManifest.host_permissions).not.toContain(analyticsOrigin)
    expect(firefoxManifest.host_permissions).not.toContain(analyticsOrigin)
    expect(firefoxManifest.host_permissions).not.toContain('tabs')
  })

  it('uses extension-local storage for cross-context settings', () => {
    expect(chromeManifest.permissions).toEqual(['storage'])
    expect(firefoxManifest.permissions).toEqual(['storage'])
  })
})

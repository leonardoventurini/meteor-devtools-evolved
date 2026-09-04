import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const PNG_SIGNATURE_LENGTH = 8
const PNG_WIDTH_OFFSET = PNG_SIGNATURE_LENGTH + 8
const PNG_HEIGHT_OFFSET = PNG_WIDTH_OFFSET + 4
const ICON_SIZES = [16, 32, 48, 64, 128] as const

const readPngDimensions = (relativePath: string) => {
  const image = readFileSync(
    path.resolve(import.meta.dirname, '..', relativePath),
  )

  return {
    width: image.readUInt32BE(PNG_WIDTH_OFFSET),
    height: image.readUInt32BE(PNG_HEIGHT_OFFSET),
  }
}

describe('Meteor brand assets', () => {
  it.each(ICON_SIZES)('provides a square %dpx packaged icon', size => {
    expect(readPngDimensions(`public/icons/meteor-${size}.png`)).toEqual({
      width: size,
      height: size,
    })
  })

  it('keeps the toolbar and manifest on the packaged icon family', () => {
    const tabBar = readFileSync(
      path.resolve(import.meta.dirname, '../src/Components/TabBar.tsx'),
      'utf8',
    )
    const manifest = readFileSync(
      path.resolve(import.meta.dirname, '../src/Config/Manifest.ts'),
      'utf8',
    )

    expect(tabBar).toContain("const METEOR_LOGO_PATH = '/icons/meteor-32.png'")

    for (const size of [16, 32, 48, 128] as const) {
      expect(manifest).toContain(`${size}: '/icons/meteor-${size}.png'`)
    }
  })
})

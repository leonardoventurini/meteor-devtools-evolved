import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(import.meta.dirname, '..', relativePath), 'utf8')

/**
 * Rendered dimensions, scrolling, and padding are covered by ui-layout.spec.ts.
 * These checks retain the navigation's semantic and asset contracts.
 */
describe('panel navigation contracts', () => {
  it('separates primary navigation from top-right controls', () => {
    const tabBar = readSource('src/Components/TabBar.tsx')

    expect(tabBar).toContain("'mde-top-toolbar'")
    expect(tabBar).toContain("'mde-sidebar'")
    expect(tabBar).toContain("aria-label='Panel navigation'")
    expect(tabBar).toContain('active={activeKey === tab.key}')
    expect(tabBar).not.toContain('useState')
  })

  it('uses the packaged Meteor logo with an accessible name', () => {
    const tabBar = readSource('src/Components/TabBar.tsx')

    expect(tabBar).toContain("const METEOR_LOGO_PATH = '/icons/meteor-32.png'")
    expect(tabBar).toContain("alt='Meteor DevTools'")
  })
})

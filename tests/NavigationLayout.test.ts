import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  NAVBAR_HEIGHT,
  SIDEBAR_WIDTH,
  STATUS_HEIGHT,
} from '../src/Styles/Constants'

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(import.meta.dirname, '..', relativePath), 'utf8')

describe('panel navigation layout', () => {
  it('uses stable shared dimensions for the toolbar, sidebar, and status bar', () => {
    expect(NAVBAR_HEIGHT).toBe(40)
    expect(SIDEBAR_WIDTH).toBe(160)
    expect(STATUS_HEIGHT).toBe(29)

    const panel = readSource('src/Pages/Panel.tsx')
    expect(panel).toContain('padding-top: ${NAVBAR_HEIGHT}px')
    expect(panel).toContain('padding-left: ${SIDEBAR_WIDTH}px')
    expect(panel).toContain('top: ${NAVBAR_HEIGHT}px')
    expect(panel).toContain('width: ${SIDEBAR_WIDTH}px')
  })

  it('separates primary navigation from top-right controls', () => {
    const tabBar = readSource('src/Components/TabBar.tsx')
    expect(tabBar).toContain("className='mde-top-toolbar'")
    expect(tabBar).toContain("className='mde-sidebar'")
    expect(tabBar).toContain("aria-label='Panel navigation'")
    expect(tabBar).toContain('active={activeKey === tab.key}')
    expect(tabBar).toContain('padding: 0;')
    expect(tabBar).toContain('flex: 0 0 32px;')
    expect(tabBar).toContain('height: 32px;')
    expect(tabBar).toContain('width: max-content;')
    expect(tabBar).toContain('white-space: nowrap;')
    expect(tabBar).toContain('text-overflow: clip;')
    expect(tabBar).not.toContain('useState')
  })

  it('anchors the packaged Meteor logo at the left of the toolbar', () => {
    const tabBar = readSource('src/Components/TabBar.tsx')

    expect(tabBar).toContain("const METEOR_LOGO_PATH = '/icons/meteor-32.png'")
    expect(tabBar).toContain("className='mde-toolbar-brand'")
    expect(tabBar).toContain("alt='Meteor DevTools'")
    expect(tabBar).toContain('height: 24px;')
    expect(tabBar).toContain('padding: 0 12px;')
    expect(tabBar).not.toContain('transform: translate(')
  })

  it('uses the independent status-bar height', () => {
    const statusBar = readSource('src/Components/StatusBar.tsx')
    expect(statusBar).toContain(
      "import { STATUS_HEIGHT } from '@/Styles/Constants'",
    )
    expect(statusBar).toContain('height: ${STATUS_HEIGHT}px')
  })
})

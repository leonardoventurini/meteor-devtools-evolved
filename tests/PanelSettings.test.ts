import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = path.resolve(import.meta.dirname, '..')
const readSource = (relativePath: string) =>
  readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('DevTools settings page', () => {
  it('is routed as a panel page from a bottom-anchored sidebar tab', () => {
    const constants = readSource('src/Constants.ts')
    const navigation = readSource('src/Pages/Panel/Navigation.tsx')
    const panel = readSource('src/Pages/Panel.tsx')
    const tabBar = readSource('src/Components/TabBar.tsx')

    expect(constants).toContain("SETTINGS = 'settings'")
    expect(navigation).toContain('key: PanelPage.SETTINGS')
    expect(navigation).toContain("content: 'Settings'")
    expect(navigation).toContain("icon: 'cog'")
    expect(navigation).toContain("placement: 'bottom'")
    expect(panel).toContain('<Settings')
    expect(panel).toContain('PanelPage.SETTINGS')
    expect(tabBar).toContain("tab.placement === 'bottom'")
    expect(tabBar).toContain('margin-top: auto;')
  })

  it('persists policy changes and prompts to reload after a successful save', () => {
    const settings = readSource('src/Pages/Panel/Settings/Settings.tsx')

    expect(settings).toContain('getDDPHistoryPolicy()')
    expect(settings).toContain('setDDPHistoryPolicy(nextPolicy)')
    expect(settings).toContain('setReloadDialogOpen(')
    expect(settings).toContain('initialPolicy !== nextPolicy')
    expect(settings).toContain("role='alertdialog'")
    expect(settings).toContain("title='Reload DevTools panel?'")
    expect(settings).toContain('location.reload()')
    expect(settings).toContain('Reload now')
    expect(settings).toContain('Later')
    expect(settings).not.toContain("title='Reload required'")
  })

  it('keeps readable, responsive spacing inside the shared panel shell', () => {
    const settings = readSource('src/Pages/Panel/Settings/Settings.tsx')

    expect(settings).toContain('padding: 0;')
    expect(settings).toContain('width: 100%;')
    expect(settings).toContain('max-width: 688px;')
    expect(settings).toContain('padding: clamp(16px, 3vw, 24px);')
    expect(settings).toContain('box-sizing: border-box;')
    expect(settings).toContain('overflow-y: auto !important;')
  })

  it('removes the standalone browser Options surface', () => {
    expect(existsSync(path.join(projectRoot, 'src/entrypoints/options'))).toBe(
      false,
    )
    expect(existsSync(path.join(projectRoot, 'src/Pages/Options.tsx'))).toBe(
      false,
    )

    const validator = readSource('scripts/validate-build.mjs')
    expect(validator).not.toContain('manifest.options_ui')
    expect(validator).not.toContain("'options.html'")
  })
})

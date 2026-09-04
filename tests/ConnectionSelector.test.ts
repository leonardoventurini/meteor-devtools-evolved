import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(import.meta.dirname, '..', relativePath), 'utf8')

describe('global DDP connection selection', () => {
  it('exposes an accessible selector that refreshes scoped panel data', () => {
    const navigation = readSource('src/Pages/Panel/Navigation.tsx')
    const panelStore = readSource('src/Stores/PanelStore.tsx')
    const tabBar = readSource('src/Components/TabBar.tsx')

    expect(navigation).toContain(
      "import { HTMLSelect, Tag } from '@blueprintjs/core'",
    )
    expect(navigation).toContain('<HTMLSelect')
    expect(navigation).not.toMatch(/<select\b/)
    expect(navigation).toContain("aria-label='Meteor DDP connection'")
    expect(navigation).toContain("className='mde-connection-selector'")
    expect(navigation).toContain('syncConnectionData(event.target.value)')
    expect(panelStore).toContain(
      'minimongoStore.setActiveConnectionId(connectionId)',
    )
    expect(tabBar).toContain('margin: 4px 0;')
    expect(tabBar).toContain('padding: 0 28px 0 10px;')
    expect(tabBar).toContain('border-radius: 3px;')
  })

  it('does not hard-code the default connection in data injectors', () => {
    for (const sourcePath of [
      'src/Injectors/DDPInjector.ts',
      'src/Injectors/MinimongoInjector.ts',
      'src/Browser/MeteorLibrary.ts',
    ]) {
      expect(readSource(sourcePath)).not.toContain('Meteor.connection')
    }
  })
})

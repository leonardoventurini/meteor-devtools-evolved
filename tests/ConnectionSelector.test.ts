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

    expect(navigation).toContain('<ConnectionSelector')
    expect(navigation).not.toContain('HTMLSelect')
    expect(navigation).toContain('syncConnectionData(connectionId)')
    expect(panelStore).toContain(
      'minimongoStore.setActiveConnectionId(connectionId)',
    )
    expect(tabBar).toContain('height: 100%;')
    expect(tabBar).toContain('min-width: 9rem;')
    expect(tabBar).toContain('max-width: 16rem;')
    expect(tabBar).toContain('padding: 0 10px;')
    expect(tabBar).not.toContain('border-radius: 3px;')
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

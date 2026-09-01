import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const readSource = (relativePath: string) =>
  readFileSync(path.resolve(import.meta.dirname, '..', relativePath), 'utf8')

describe('global DDP connection selection', () => {
  it('exposes an accessible selector that refreshes scoped panel data', () => {
    const navigation = readSource('src/Pages/Panel/Navigation.tsx')

    expect(navigation).toContain("aria-label='Meteor DDP connection'")
    expect(navigation).toContain('syncConnectionData(event.target.value)')
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

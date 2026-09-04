import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  path.resolve(
    import.meta.dirname,
    '../src/Pages/Panel/ConnectionSelector.tsx',
  ),
  'utf8',
)

describe('toolbar connection selector', () => {
  it('uses an accessible controlled Blueprint menu', () => {
    expect(source).toContain('<PopoverNext')
    expect(source).toContain('<Menu')
    expect(source).toContain("aria-haspopup='menu'")
    expect(source).toContain('aria-expanded={isOpen}')
    expect(source).toContain('aria-controls={menuId}')
    expect(source).toContain('active={connection.id === activeConnectionId}')
  })

  it('dismisses the menu after selecting by connection ID', () => {
    expect(source).toContain('onChange(connection.id)')
    expect(source).toContain('setIsOpen(false)')
  })
})

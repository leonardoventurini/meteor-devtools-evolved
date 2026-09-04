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
const buttonSource = readFileSync(
  path.resolve(import.meta.dirname, '../src/Components/Button.tsx'),
  'utf8',
)

describe('toolbar connection selector', () => {
  it('uses an accessible controlled Blueprint menu', () => {
    expect(source).toContain('<PopoverNext')
    expect(source).toContain('<Menu')
    expect(source).toContain("aria-haspopup='listbox'")
    expect(source).toContain('aria-expanded={isOpen}')
    expect(source).toContain('aria-controls={menuId}')
    expect(source).toContain("role='listbox'")
    expect(source).toContain("roleStructure='listoption'")
    expect(source).toContain(
      'selected={connection.id === resolvedActiveConnectionId}',
    )
    expect(source).toContain('active={connection.id === focusedConnectionId}')
    expect(source).toContain("className='mde-connection-trigger'")
    expect(source).toContain("<Icon icon='caret-down' size={14} />")
    expect(source).toContain('onKeyDown={handleMenuKeyDown}')
    expect(source).toContain(
      'autoFocus={connection.id === focusedConnectionId}',
    )
  })

  it('dismisses the menu after selecting by connection ID', () => {
    expect(source).toContain('selectConnection(connection.id)')
    expect(source).toContain('onChange(connectionId)')
    expect(source).toContain('setIsOpen(false)')
  })

  it('repairs a missing active connection and disables an empty selector', () => {
    expect(source).toContain('resolveActiveConnectionId(')
    expect(source).toContain('onChange(resolvedActiveConnectionId)')
    expect(source).toContain('disabled={connections.length === 0}')
  })

  it('restores focus through the shared toolbar button DOM ref', () => {
    expect(buttonSource).toContain('forwardRef<HTMLButtonElement, Props>')
    expect(source).toContain('triggerRef.current?.focus()')
    expect(source).toContain("?.querySelector<HTMLElement>('a')")
  })
})

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const popoverFiles = [
  'src/Components/Button.tsx',
  'src/Components/PopoverButton.tsx',
  'src/Components/TabBar.tsx',
  'src/Pages/Panel/DrawerJSON.tsx',
]

const projectRoot = path.resolve(import.meta.dirname, '..')

describe('Blueprint React compatibility', () => {
  it.each(popoverFiles)('%s uses the React 19-safe PopoverNext', file => {
    const source = readFileSync(path.join(projectRoot, file), 'utf8')

    expect(source).toContain('PopoverNext')
    expect(source).not.toMatch(/<Popover(?:\s|>)/)
    expect(source).not.toMatch(/\bPopover\b.*from '@blueprintjs\/core'/)
  })
})

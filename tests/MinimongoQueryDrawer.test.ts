import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  path.resolve(
    import.meta.dirname,
    '../src/Pages/Panel/Minimongo/MinimongoQueryDrawer.tsx',
  ),
  'utf8',
)

describe('Minimongo query drawer', () => {
  it('renders from the right with explicitly spaced query feedback', () => {
    expect(source).toContain('<Drawer')
    expect(source).toContain("position='right'")
    expect(source).toContain('Classes.DIALOG_BODY')
    expect(source).toContain("'flex flex-col gap-4'")
    expect(source).not.toMatch(/<Dialog\b/)
  })
})

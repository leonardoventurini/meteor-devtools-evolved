import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const drawerSource = readFileSync(
  path.resolve(import.meta.dirname, '../src/Pages/Panel/DrawerStackTrace.tsx'),
  'utf8',
)

describe('stack trace drawer', () => {
  it('separates the cleaned and raw view controls', () => {
    expect(drawerSource).toContain("<ButtonGroup className='gap-2' minimal>")
  })
})

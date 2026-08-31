import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const navigationSource = readFileSync(
  path.resolve(import.meta.dirname, '../src/Pages/Panel/Navigation.tsx'),
  'utf8',
)

describe('panel navigation', () => {
  it('does not expose the retired sponsorship action', () => {
    expect(navigationSource).not.toContain("key: 'sponsor'")
    expect(navigationSource).not.toContain('github.com/sponsors')
    expect(navigationSource).not.toContain('consider sponsoring')
  })
})

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const entrypointSource = readFileSync(
  path.resolve(import.meta.dirname, '../src/entrypoints/devtools/main.ts'),
  'utf8',
)

describe('DevTools panel registration', () => {
  it('uses the plain Meteor tab title in every browser', () => {
    expect(entrypointSource).toContain("const panelTitle = 'Meteor'")
    expect(entrypointSource).not.toContain('☄️')
  })
})

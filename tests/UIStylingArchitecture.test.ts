import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '..')

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name)

    return entry.isDirectory() ? sourceFiles(entryPath) : [entryPath]
  })

describe('build-time UI styling boundary', () => {
  it('does not depend on the removed runtime styling engine', () => {
    const manifest = JSON.parse(
      readFileSync(path.join(root, 'package.json'), 'utf8'),
    ) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }

    expect(manifest.dependencies).not.toHaveProperty('styled-components')
    expect(manifest.devDependencies).not.toHaveProperty('styled-components')
    expect(readFileSync(path.join(root, 'yarn.lock'), 'utf8')).not.toContain(
      'styled-components@',
    )
  })

  it('keeps runtime styling imports out of application source', () => {
    const offenders = sourceFiles(path.join(root, 'src'))
      .filter(file => /\.[cm]?[jt]sx?$/.test(file))
      .filter(file =>
        /(?:from\s*|import\s*\(|require\s*\()\s*['"]styled-components(?:\/[^'"]*)?['"]/.test(
          readFileSync(file, 'utf8'),
        ),
      )
      .map(file => path.relative(root, file))

    expect(offenders).toEqual([])
  })
})

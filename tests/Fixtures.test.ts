import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

type FixturePackageJson = {
  name: string
  private: boolean
  scripts: Record<string, string>
  devDependencies?: Record<string, string>
}

const projectRoot = path.resolve(import.meta.dirname, '..')
const maintainedFixtures = {
  'devapp-2.16': 'METEOR@2.16',
  'devapp-3.5': 'METEOR@3.5.1',
} as const
const obsoleteFixtureNames = [
  'devapp-2.0.0',
  'devapp-2.2.0',
  'devapp-2.2.4',
  'devapp-3.4',
] as const

const readFixturePackage = (fixtureName: string): FixturePackageJson =>
  JSON.parse(
    readFileSync(path.join(projectRoot, fixtureName, 'package.json'), 'utf8'),
  ) as FixturePackageJson

describe('Meteor compatibility fixtures', () => {
  it('maintains only the current Meteor 2 and Meteor 3 baselines', () => {
    const fixtureNames = readdirSync(projectRoot)
      .filter(name => /^devapp-\d/.test(name))
      .toSorted()

    expect(fixtureNames).toEqual(Object.keys(maintainedFixtures))
  })

  it.each(Object.entries(maintainedFixtures))(
    '%s has a pinned release and runnable test contract',
    (fixtureName, meteorRelease) => {
      const fixtureRoot = path.join(projectRoot, fixtureName)
      const packageJson = readFixturePackage(fixtureName)

      expect(
        readFileSync(path.join(fixtureRoot, '.meteor/release'), 'utf8').trim(),
      ).toBe(meteorRelease)
      expect(packageJson.name).toBe(fixtureName)
      expect(packageJson.private).toBe(true)
      expect(packageJson.scripts).toHaveProperty('start')
      expect(packageJson.scripts).toHaveProperty('test')
      expect(packageJson.scripts).toHaveProperty('test-app')
      expect(existsSync(path.join(fixtureRoot, 'package-lock.json'))).toBe(true)
    },
  )

  it('removes obsolete fixture identities', () => {
    for (const fixtureName of obsoleteFixtureNames) {
      expect(existsSync(path.join(projectRoot, fixtureName))).toBe(false)
    }
  })

  it('installs the Meteor-compatible Rspack development stack', () => {
    const packageJson = readFixturePackage('devapp-3.5')

    expect(packageJson.scripts.start).toBe('meteor run --port 2100')
    expect(packageJson.devDependencies).toMatchObject({
      '@meteorjs/rspack': '2.1.0',
      '@rspack/cli': '1.7.5',
      '@rspack/core': '1.7.5',
      '@rspack/dev-server': '1.1.5',
      '@rspack/plugin-react-refresh': '1.6.0',
    })
  })
})

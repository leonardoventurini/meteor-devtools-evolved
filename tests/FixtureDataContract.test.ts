import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  FIXTURE_COLLECTION_COUNTS,
  FIXTURE_CONTRACT_VERSION,
  FIXTURE_METHODS,
  FIXTURE_PUBLICATIONS,
} from './e2e/MeteorFixtures'

type FixtureDocument = Record<string, unknown> & { _id: string }

interface FixtureDataModule {
  FIXTURE_COLLECTION_NAMES: Record<string, string>
  FIXTURE_CONTRACT_VERSION: number
  FIXTURE_COUNTS: Record<string, number>
  FIXTURE_METHODS: readonly string[]
  FIXTURE_PUBLICATIONS: readonly string[]
  generateEvents?: () => FixtureDocument[]
  generateProjects?: () => FixtureDocument[]
  generateRemoteRecords?: () => FixtureDocument[]
  generateTasks?: () => FixtureDocument[]
  makeEvents?: () => FixtureDocument[]
  makeProjects?: () => FixtureDocument[]
  makeRemoteRecords?: () => FixtureDocument[]
  makeTasks?: () => FixtureDocument[]
}

const projectRoot = path.resolve(import.meta.dirname, '..')
const fixtureNames = ['devapp-2.16', 'devapp-3.5'] as const

const loadFixtureData = async (
  fixtureName: (typeof fixtureNames)[number],
): Promise<FixtureDataModule> => {
  const moduleUrl = pathToFileURL(
    path.join(projectRoot, fixtureName, 'imports/api/fixture-data.js'),
  ).href

  return import(/* @vite-ignore */ moduleUrl) as Promise<FixtureDataModule>
}

const generateDocuments = (
  fixtureData: FixtureDataModule,
  collection: 'events' | 'projects' | 'remote' | 'tasks',
): FixtureDocument[] => {
  if (collection === 'remote') {
    const generator =
      fixtureData.generateRemoteRecords ?? fixtureData.makeRemoteRecords
    if (typeof generator !== 'function') {
      throw new TypeError('Missing procedural remote generator.')
    }

    return generator()
  }

  const capitalized = `${collection[0]?.toUpperCase()}${collection.slice(1)}`
  const generator =
    fixtureData[`generate${capitalized}` as keyof FixtureDataModule] ??
    fixtureData[`make${capitalized}` as keyof FixtureDataModule]

  if (typeof generator !== 'function') {
    throw new TypeError(`Missing procedural ${collection} generator.`)
  }

  return generator()
}

describe('expanded Meteor fixture data contract', () => {
  it.each(fixtureNames)(
    '%s exports the shared catalogs and exact counts',
    async fixtureName => {
      const fixtureData = await loadFixtureData(fixtureName)

      expect(fixtureData.FIXTURE_CONTRACT_VERSION).toBe(
        FIXTURE_CONTRACT_VERSION,
      )
      expect(fixtureData.FIXTURE_COUNTS).toEqual(FIXTURE_COLLECTION_COUNTS)
      expect(fixtureData.FIXTURE_PUBLICATIONS).toEqual(FIXTURE_PUBLICATIONS)
      expect(fixtureData.FIXTURE_METHODS).toEqual(FIXTURE_METHODS)
      expect(fixtureData.FIXTURE_COLLECTION_NAMES).toMatchObject({
        events: 'fixtureEvents',
        projects: 'fixtureProjects',
        remote: 'fixtureRemote',
        tasks: 'fixtureTasks',
      })
    },
  )

  it.each(fixtureNames)(
    '%s generates deterministic, unique rich records',
    async fixtureName => {
      const fixtureData = await loadFixtureData(fixtureName)
      const projects = generateDocuments(fixtureData, 'projects')
      const tasks = generateDocuments(fixtureData, 'tasks')
      const events = generateDocuments(fixtureData, 'events')
      const remote = generateDocuments(fixtureData, 'remote')
      const primary = [...projects, ...tasks, ...events]

      expect({
        events: events.length,
        projects: projects.length,
        remote: remote.length,
        tasks: tasks.length,
      }).toEqual(FIXTURE_COLLECTION_COUNTS)
      expect(primary).toHaveLength(750)
      expect(new Set(primary.map(document => document._id)).size).toBe(750)
      expect(new Set(remote.map(document => document._id)).size).toBe(12)
      expect(generateDocuments(fixtureData, 'projects')).toEqual(projects)
      expect(generateDocuments(fixtureData, 'tasks')).toEqual(tasks)

      const serialized = JSON.stringify(primary)
      expect(serialized).toMatch(/[\u0080-\uFFFF]/)
      expect(serialized).toContain(String.raw`\n`)
      expect(
        primary.some(document => Object.values(document).includes(null)),
      ).toBe(true)
      expect(
        primary.some(document =>
          Object.values(document).some(value => value instanceof Date),
        ),
      ).toBe(true)
      expect(
        primary.some(document =>
          Object.values(document).some(value => Array.isArray(value)),
        ),
      ).toBe(true)
      expect(
        primary.some(document =>
          Object.values(document).some(
            value => typeof value === 'string' && value.length >= 256,
          ),
        ),
      ).toBe(true)
    },
  )
})

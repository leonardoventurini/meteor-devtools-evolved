export const METEOR_FIXTURE_ENVIRONMENT_KEY = 'E2E_METEOR_FIXTURE'
export const DEFAULT_METEOR_FIXTURE_ID = 'devapp-3.5'

export const FIXTURE_CONTRACT_VERSION = 1
export const FIXTURE_COLLECTION_COUNTS = {
  events: 510,
  projects: 20,
  remote: 12,
  tasks: 220,
} as const
export const FIXTURE_PUBLICATIONS = [
  'fixture.projects',
  'fixture.tasks',
  'fixture.dashboard',
  'fixture.tasks.overlap',
  'fixture.empty',
  'fixture.delayed',
  'fixture.rejected',
  'fixture.remote',
] as const
export const FIXTURE_METHODS = [
  'fixture.echo',
  'fixture.values',
  'fixture.delayed',
  'fixture.fail',
  'fixture.mutation.insert',
  'fixture.mutation.update',
  'fixture.mutation.remove',
  'fixture.mutation.reset',
  'fixture.burst',
] as const

export interface MeteorFixtureDescriptor {
  contractVersion: number
  collectionCounts: typeof FIXTURE_COLLECTION_COUNTS
  id: string
  localFixtureLabel: string
  method: {
    expectedResult: string
    name: string
    parameters: readonly unknown[]
    resultComparison: 'contains' | 'equals'
  }
  namedCollection: string
  port: number
  publications: readonly string[]
  readinessText: string
  release: string
  requiredSubscriptions: readonly string[]
  methods: readonly string[]
  startCommand: string
  url: string
}

export const METEOR_FIXTURES = {
  'devapp-3.5': {
    contractVersion: FIXTURE_CONTRACT_VERSION,
    collectionCounts: FIXTURE_COLLECTION_COUNTS,
    id: 'devapp-3.5',
    localFixtureLabel: 'Meteor 3.5.1',
    method: {
      expectedResult: 'This is a Meteor application',
      name: 'about',
      parameters: [],
      resultComparison: 'contains',
    },
    namedCollection: 'links',
    port: 2100,
    publications: FIXTURE_PUBLICATIONS,
    readinessText: 'Learn Meteor!',
    release: 'METEOR@3.5.1',
    requiredSubscriptions: ['links', 'fixture.dashboard', 'fixture.tasks'],
    methods: FIXTURE_METHODS,
    startCommand: 'yarn devapp',
    url: 'http://127.0.0.1:2100',
  },
  'devapp-2.16': {
    contractVersion: FIXTURE_CONTRACT_VERSION,
    collectionCounts: FIXTURE_COLLECTION_COUNTS,
    id: 'devapp-2.16',
    localFixtureLabel: 'Meteor 2.16',
    method: {
      expectedResult: 'Meteor 2 Playwright echo',
      name: 'echo',
      parameters: ['Meteor 2 Playwright echo'],
      resultComparison: 'equals',
    },
    namedCollection: 'random',
    port: 2200,
    publications: FIXTURE_PUBLICATIONS,
    readinessText: 'Meteor DevTools scenario catalog',
    release: 'METEOR@2.16',
    requiredSubscriptions: [
      'random1to100',
      'random901to1000',
      'fixture.projects',
      'fixture.dashboard',
    ],
    methods: FIXTURE_METHODS,
    startCommand: 'yarn devapp:2',
    url: 'http://127.0.0.1:2200',
  },
} as const satisfies Record<string, MeteorFixtureDescriptor>

export type MeteorFixtureId = keyof typeof METEOR_FIXTURES

export const resolveMeteorFixture = (
  fixtureId = process.env[METEOR_FIXTURE_ENVIRONMENT_KEY],
): MeteorFixtureDescriptor => {
  const selectedId = fixtureId ?? DEFAULT_METEOR_FIXTURE_ID

  if (!Object.hasOwn(METEOR_FIXTURES, selectedId)) {
    throw new TypeError(
      `Unknown Meteor E2E fixture "${selectedId}". Expected one of: ${Object.keys(
        METEOR_FIXTURES,
      ).join(', ')}.`,
    )
  }

  return METEOR_FIXTURES[selectedId as MeteorFixtureId]
}

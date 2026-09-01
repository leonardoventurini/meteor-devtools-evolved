export const METEOR_FIXTURE_ENVIRONMENT_KEY = 'E2E_METEOR_FIXTURE'
export const DEFAULT_METEOR_FIXTURE_ID = 'devapp-3.5'

export interface MeteorFixtureDescriptor {
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
  readinessText: string
  release: string
  requiredSubscriptions: readonly string[]
  startCommand: string
  url: string
}

export const METEOR_FIXTURES = {
  'devapp-3.5': {
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
    readinessText: 'Learn Meteor!',
    release: 'METEOR@3.5.1',
    requiredSubscriptions: ['links'],
    startCommand: 'yarn devapp',
    url: 'http://127.0.0.1:2100',
  },
  'devapp-2.16': {
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
    readinessText: 'Welcome to Meteor!',
    release: 'METEOR@2.16',
    requiredSubscriptions: ['random1to100', 'random901to1000'],
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

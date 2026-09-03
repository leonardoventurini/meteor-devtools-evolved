export const FIXTURE_COUNTS = Object.freeze({
  projects: 20,
  tasks: 220,
  events: 510,
  remote: 12,
})

export const FIXTURE_COLLECTION_NAMES = Object.freeze({
  projects: 'fixtureProjects',
  tasks: 'fixtureTasks',
  events: 'fixtureEvents',
  remote: 'fixtureRemote',
  clientOps: 'fixtureClientOps',
})

export const FIXTURE_PUBLICATIONS = Object.freeze([
  'fixture.projects',
  'fixture.tasks',
  'fixture.dashboard',
  'fixture.tasks.overlap',
  'fixture.empty',
  'fixture.delayed',
  'fixture.rejected',
  'fixture.remote',
])

export const FIXTURE_METHODS = Object.freeze([
  'fixture.echo',
  'fixture.values',
  'fixture.delayed',
  'fixture.fail',
  'fixture.mutation.insert',
  'fixture.mutation.update',
  'fixture.mutation.remove',
  'fixture.mutation.reset',
  'fixture.burst',
])

export const FIXTURE_CONTRACT_VERSION = 1
export const FIXTURE_MUTATION_ID = 'fixture-task-mutation'

const BASE_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0)
const LONG_TEXT = 'Meteor DevTools deterministic long value · '.repeat(24)
const STATUSES = Object.freeze(['planned', 'active', 'blocked', 'done'])
const TAGS = Object.freeze(['frontend', 'backend', 'testing', 'docs'])

const timestampAt = index => new Date(BASE_TIMESTAMP + index * 60_000)
const padded = (prefix, index, width = 3) =>
  `${prefix}-${String(index).padStart(width, '0')}`

export const makeProjects = () =>
  Array.from({ length: FIXTURE_COUNTS.projects }, (_, offset) => {
    const index = offset + 1

    return {
      _id: padded('project', index, 2),
      name: index === 1 ? 'Árvore & Meteor ☄️' : `Fixture Project ${index}`,
      ordinal: index,
      active: index % 3 !== 0,
      createdAt: timestampAt(index),
      owner: {
        id: padded('owner', (index % 5) + 1, 2),
        profile: { region: ['americas', 'emea', 'apac'][index % 3] },
      },
      tags: [TAGS[index % TAGS.length], TAGS[(index + 1) % TAGS.length]],
      budget: index === 2 ? 0 : index === 3 ? -125 : index * 1_000,
      nullable: index % 4 === 0 ? null : `project-value-${index}`,
      ...(index % 5 === 0 ? {} : { optionalNote: `Note ${index}` }),
    }
  })

export const makeTasks = () =>
  Array.from({ length: FIXTURE_COUNTS.tasks }, (_, offset) => {
    const index = offset + 1
    const projectIndex = ((index - 1) % FIXTURE_COUNTS.projects) + 1

    return {
      _id: padded('task', index),
      projectId: padded('project', projectIndex, 2),
      title: index === 7 ? 'Unicode task: ação, 東京, 🚀' : `Fixture Task ${index}`,
      ordinal: index,
      status: STATUSES[index % STATUSES.length],
      priority: index % 11 === 0 ? -1 : index % 6,
      dueAt: timestampAt(1_000 + index),
      labels: [TAGS[index % TAGS.length], `bucket-${index % 7}`],
      metrics: {
        estimate: index % 13,
        progress: (index % 11) / 10,
        checkpoints: [index, index + 1, index + 2],
      },
      description:
        index === 8
          ? 'First deterministic line\nSecond deterministic line'
          : index === 9
            ? LONG_TEXT
            : `Generated task ${index}`,
      nullable: index % 10 === 0 ? null : `task-value-${index}`,
      ...(index % 9 === 0 ? {} : { optionalRank: index % 17 }),
    }
  })

export const makeEvents = () =>
  Array.from({ length: FIXTURE_COUNTS.events }, (_, offset) => {
    const index = offset + 1

    return {
      _id: padded('event', index),
      taskId: padded('task', ((index - 1) % FIXTURE_COUNTS.tasks) + 1),
      projectId: padded(
        'project',
        ((index - 1) % FIXTURE_COUNTS.projects) + 1,
        2,
      ),
      sequence: index,
      occurredAt: timestampAt(2_000 + index),
      kind: ['created', 'assigned', 'commented', 'completed'][index % 4],
      actor: { id: padded('actor', (index % 9) + 1, 2), automated: index % 5 === 0 },
      payload: {
        attempts: index % 4,
        successful: index % 6 !== 0,
        values: [index, -index, 0],
      },
      nullable: index % 16 === 0 ? null : `event-value-${index}`,
      ...(index % 12 === 0 ? {} : { source: 'fixture' }),
    }
  })

export const makeRemoteRecords = () =>
  Array.from({ length: FIXTURE_COUNTS.remote }, (_, offset) => {
    const index = offset + 1

    return {
      _id: padded('remote', index, 2),
      ordinal: index,
      connectionScope: 'secondary',
      recordedAt: timestampAt(3_000 + index),
      nested: { enabled: index % 2 === 0 },
    }
  })

export const makeSafeComplexValues = () => ({
  string: 'Meteor 2 safe values · Olá 東京 🚀',
  multiline: 'line one\nline two',
  longString: LONG_TEXT,
  date: timestampAt(4_000),
  boolean: true,
  nullValue: null,
  zero: 0,
  negative: -42,
  boundary: Number.MAX_SAFE_INTEGER,
  array: [1, 'two', false, null, { nested: 'value' }],
  nested: { level: { count: 3, labels: ['safe', 'deterministic'] } },
})

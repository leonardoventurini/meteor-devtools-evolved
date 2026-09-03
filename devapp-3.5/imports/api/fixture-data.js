export const FIXTURE_CONTRACT_VERSION = 1
export const FIXTURE_COUNTS = Object.freeze({ projects: 20, tasks: 220, events: 510, remote: 12 })
export const FIXTURE_COLLECTION_NAMES = Object.freeze({ projects: 'fixtureProjects', tasks: 'fixtureTasks', events: 'fixtureEvents', remote: 'fixtureRemote', clientOps: 'fixtureClientOps' })
export const FIXTURE_PUBLICATIONS = Object.freeze(['fixture.projects', 'fixture.tasks', 'fixture.dashboard', 'fixture.tasks.overlap', 'fixture.empty', 'fixture.delayed', 'fixture.rejected', 'fixture.remote'])
export const FIXTURE_METHODS = Object.freeze(['fixture.echo', 'fixture.values', 'fixture.delayed', 'fixture.fail', 'fixture.mutation.insert', 'fixture.mutation.update', 'fixture.mutation.remove', 'fixture.mutation.reset', 'fixture.burst'])

const BASE_TIME = Date.UTC(2024, 0, 1, 12, 0, 0)
const LONG_TEXT = 'deterministic-long-value-'.repeat(24)
const pad = (value, width = 3) => String(value).padStart(width, '0')
export const projectId = (index) => `project-${pad(index, 2)}`
export const taskId = (index) => `task-${pad(index)}`

export const generateProjects = () => Array.from({ length: FIXTURE_COUNTS.projects }, (_, index) => ({
  _id: projectId(index), name: index === 0 ? 'Projeto São José 🚀' : `Fixture project ${pad(index, 2)}`,
  status: ['active', 'paused', 'archived'][index % 3], priority: index % 5 === 0 ? 0 : index - 10,
  tags: ['fixture', `group-${index % 4}`], profile: { owner: { name: `Owner ${index}`, locale: index % 2 === 0 ? 'pt-BR' : 'en-US' }, score: index * 5 },
  nullable: index % 4 === 0 ? null : `value-${index}`, createdAt: new Date(BASE_TIME + index * 86_400_000),
  ...(index % 5 === 0 ? {} : { optionalNote: `note-${index}` }),
}))

export const generateTasks = () => Array.from({ length: FIXTURE_COUNTS.tasks }, (_, index) => ({
  _id: taskId(index), projectId: projectId(index % FIXTURE_COUNTS.projects),
  title: index === 0 ? 'Multiline task\nsecond line\nthird line' : `Fixture task ${pad(index)}`, sequence: index,
  estimate: index === 1 ? -1 : index === 2 ? 0 : index % 21, completed: index % 3 === 0,
  labels: [`lane-${index % 5}`, index % 2 === 0 ? 'even' : 'odd'],
  assignee: { name: `Developer ${index % 11}`, contact: { region: index % 2 === 0 ? 'LATAM' : 'NA' } },
  dueAt: new Date(BASE_TIME + index * 3_600_000), nullable: index % 7 === 0 ? null : index,
  ...(index % 9 === 0 ? {} : { description: index === 3 ? LONG_TEXT : `Task description ${index}` }),
}))

export const generateEvents = () => Array.from({ length: FIXTURE_COUNTS.events }, (_, index) => ({
  _id: `event-${pad(index)}`, projectId: projectId(index % FIXTURE_COUNTS.projects), taskId: taskId(index % FIXTURE_COUNTS.tasks),
  type: ['created', 'assigned', 'updated', 'completed'][index % 4], ordinal: index, delta: index % 2 === 0 ? index : -index,
  context: { actor: `actor-${index % 13}`, source: { kind: 'fixture', version: FIXTURE_CONTRACT_VERSION } },
  flags: [index % 2 === 0, index % 3 === 0], occurredAt: new Date(BASE_TIME + index * 60_000),
}))

export const generateRemoteRecords = () => Array.from({ length: FIXTURE_COUNTS.remote }, (_, index) => ({
  _id: `remote-${pad(index, 2)}`, label: `Secondary connection record ${index}`, sequence: index,
  nested: { connection: 'secondary', unicode: index === 0 ? 'isolado ✓' : `remote-${index}` }, createdAt: new Date(BASE_TIME + index * 1_000),
}))

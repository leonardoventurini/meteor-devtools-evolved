import { check, Match } from 'meteor/check'
import { Meteor } from 'meteor/meteor'
import {
  Events,
  FIXTURE_COUNTS,
  Projects,
  Remote,
  Tasks,
  generateEvents,
  generateProjects,
  generateRemoteRecords,
  generateTasks,
  projectId,
} from '/imports/api/fixture-contract'

const DEFAULT_TASK_LIMIT = 50
const MAX_TASK_LIMIT = 220
const MAX_BURST_COUNT = 40
const MAX_DELAY_MS = 2_000
const MUTATION_ID = 'fixture-mutation'

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function replaceCollection(collection, records) {
  await collection.removeAsync({})
  await Promise.all(records.map((record) => collection.insertAsync(record)))
}

export async function seedFixtureCollections() {
  await Promise.all([
    replaceCollection(Projects, generateProjects()),
    replaceCollection(Tasks, generateTasks()),
    replaceCollection(Events, generateEvents()),
    replaceCollection(Remote, generateRemoteRecords()),
  ])
}

function validateTaskArguments(request = {}) {
  check(request, {
    projectId: String,
    limit: Match.Optional(Number),
  })

  const limit = request.limit ?? DEFAULT_TASK_LIMIT

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_TASK_LIMIT) {
    throw new Meteor.Error('fixture-invalid-limit', `limit must be between 1 and ${MAX_TASK_LIMIT}`)
  }

  return { projectId: request.projectId, limit }
}

Meteor.publish('fixture.projects', function publishProjects() {
  return Projects.find({}, { sort: { _id: 1 } })
})

Meteor.publish('fixture.tasks', function publishTasks(request) {
  const { projectId: requestedProjectId, limit } = validateTaskArguments(request)
  return Tasks.find({ projectId: requestedProjectId }, { sort: { sequence: 1 }, limit })
})

Meteor.publish('fixture.dashboard', function publishDashboard() {
  return [
    Projects.find({}, { sort: { _id: 1 } }),
    Tasks.find({}, { sort: { sequence: 1 } }),
    Events.find({}, { sort: { ordinal: 1 } }),
  ]
})

Meteor.publish('fixture.tasks.overlap', function publishOverlappingTasks() {
  return Tasks.find({ projectId: { $in: [projectId(0), projectId(1)] } }, { sort: { sequence: 1 } })
})

Meteor.publish('fixture.empty', function publishEmpty() {
  this.ready()
})

Meteor.publish('fixture.delayed', function publishDelayed(delayMs = 150) {
  check(delayMs, Number)
  const boundedDelay = Math.max(0, Math.min(MAX_DELAY_MS, delayMs))
  const timer = setTimeout(() => this.ready(), boundedDelay)
  this.onStop(() => clearTimeout(timer))
})

Meteor.publish('fixture.rejected', function publishRejected() {
  throw new Meteor.Error('fixture-publication-rejected', 'Controlled fixture publication failure', {
    scenario: 'rejected-publication',
  })
})

Meteor.publish('fixture.remote', function publishRemote() {
  return Remote.find({}, { sort: { sequence: 1 } })
})

Meteor.methods({
  async 'fixture.echo'(payload) {
    check(payload, Object)
    return { payload, server: 'meteor-3', received: true }
  },

  async 'fixture.values'() {
    return {
      date: new Date(Date.UTC(2024, 5, 15, 10, 30)),
      nested: { array: [null, true, false, 0, -7, 2147483647] },
      unicode: 'Olá, 世界 🌎',
      multiline: 'first line\nsecond line',
      long: 'method-long-value-'.repeat(20),
    }
  },

  async 'fixture.delayed'(delayMs = 100) {
    check(delayMs, Number)
    const boundedDelay = Math.max(0, Math.min(MAX_DELAY_MS, delayMs))
    await delay(boundedDelay)
    return { delayed: true, delayMs: boundedDelay }
  },

  async 'fixture.fail'() {
    throw new Meteor.Error('fixture-method-failed', 'Controlled fixture method failure', {
      scenario: 'method-failure',
    })
  },

  async 'fixture.mutation.insert'() {
    await Tasks.removeAsync(MUTATION_ID)
    await Tasks.insertAsync({
      _id: MUTATION_ID,
      projectId: projectId(0),
      title: 'Mutation lifecycle sentinel',
      sequence: FIXTURE_COUNTS.tasks,
      estimate: 1,
      completed: false,
      labels: ['mutation'],
      assignee: { name: 'Fixture', contact: { region: 'test' } },
      dueAt: new Date(Date.UTC(2024, 11, 31)),
      nullable: null,
    })
    return { _id: MUTATION_ID, transition: 'inserted' }
  },

  async 'fixture.mutation.update'() {
    const affected = await Tasks.updateAsync(MUTATION_ID, {
      $set: { completed: true, title: 'Mutation lifecycle sentinel updated' },
    })
    return { _id: MUTATION_ID, transition: 'updated', affected }
  },

  async 'fixture.mutation.remove'() {
    const affected = await Tasks.removeAsync(MUTATION_ID)
    return { _id: MUTATION_ID, transition: 'removed', affected }
  },

  async 'fixture.mutation.reset'() {
    const affected = await Tasks.removeAsync(MUTATION_ID)
    return { _id: MUTATION_ID, transition: 'reset', affected }
  },

  async 'fixture.burst'(count = 12) {
    check(count, Number)
    if (!Number.isInteger(count) || count < 1 || count > MAX_BURST_COUNT) {
      throw new Meteor.Error('fixture-invalid-burst', `count must be between 1 and ${MAX_BURST_COUNT}`)
    }

    return {
      count,
      records: Array.from({ length: count }, (_, index) => ({ index, parity: index % 2 ? 'odd' : 'even' })),
    }
  },
})

import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { Mongo } from 'meteor/mongo'
import { LinksCollection } from '../imports/api/links'
import { RandomCollection } from '../imports/api/random'
import {
  FixtureEvents,
  FixtureProjects,
  FixtureTasks,
} from '../imports/api/fixture-collections'
import {
  FIXTURE_COLLECTION_NAMES,
  FIXTURE_MUTATION_ID,
  makeEvents,
  makeProjects,
  makeRemoteRecords,
  makeSafeComplexValues,
  makeTasks,
} from '../imports/api/fixture-data'

const FixtureRemote = new Mongo.Collection(FIXTURE_COLLECTION_NAMES.remote)
const DELAY_MS = 150
const MAX_TASK_LIMIT = 220
const MAX_BURST_COUNT = 40
const MAX_DELAY_MS = 2_000

const replaceFixtureData = (collection, records) => {
  collection.remove({})
  records.forEach(record => collection.insert(record))
}

const mutationDocument = () => ({
  _id: FIXTURE_MUTATION_ID,
  projectId: 'project-01',
  title: 'Controlled mutation task',
  ordinal: 10_001,
  status: 'planned',
  priority: 0,
  dueAt: new Date(Date.UTC(2024, 0, 10)),
  labels: ['testing', 'mutation'],
  metrics: { estimate: 1, progress: 0, checkpoints: [0] },
  description: 'Inserted only during the controlled mutation scenario.',
  nullable: null,
})

function insertLink(title, url) {
  LinksCollection.insert({ title, url, createdAt: new Date() })
}

Meteor.methods({
  echo(echo) {
    return echo
  },
  'fixture.echo'(value) {
    check(value, Match.Any)
    return value
  },
  'fixture.values'() {
    return makeSafeComplexValues()
  },
  'fixture.delayed'(value, delayMs = DELAY_MS) {
    check(value, Match.Any)
    check(delayMs, Match.Integer)
    if (delayMs < 0 || delayMs > MAX_DELAY_MS) {
      throw new Meteor.Error(
        'fixture-invalid-delay',
        `Delay must be between 0 and ${MAX_DELAY_MS} milliseconds`,
      )
    }
    return new Promise(resolve => {
      Meteor.setTimeout(() => resolve({ value, delayed: true, delayMs }), delayMs)
    })
  },
  'fixture.fail'() {
    throw new Meteor.Error(
      'fixture-method-failure',
      'Controlled fixture method failure',
      'fixture.fail requested a stable failure',
    )
  },
  'fixture.mutation.insert'() {
    FixtureTasks.remove(FIXTURE_MUTATION_ID)
    FixtureTasks.insert(mutationDocument())
    return { _id: FIXTURE_MUTATION_ID, operation: 'inserted' }
  },
  'fixture.mutation.update'() {
    const affected = FixtureTasks.update(FIXTURE_MUTATION_ID, {
      $set: { status: 'done', 'metrics.progress': 1 },
    })
    return { _id: FIXTURE_MUTATION_ID, operation: 'updated', affected }
  },
  'fixture.mutation.remove'() {
    const affected = FixtureTasks.remove(FIXTURE_MUTATION_ID)
    return { _id: FIXTURE_MUTATION_ID, operation: 'removed', affected }
  },
  'fixture.mutation.reset'() {
    FixtureTasks.remove(FIXTURE_MUTATION_ID)
    return { _id: FIXTURE_MUTATION_ID, operation: 'reset' }
  },
  'fixture.burst'(count = 12) {
    check(count, Match.Integer)
    if (count < 1 || count > MAX_BURST_COUNT) {
      throw new Meteor.Error(
        'fixture-invalid-burst',
        `Burst count must be between 1 and ${MAX_BURST_COUNT}`,
      )
    }

    return Array.from({ length: count }, (_, index) => ({
      index,
      value: `fixture-burst-${index}`,
    }))
  },
})

Meteor.startup(() => {
  if (LinksCollection.find().count() === 0) {
    insertLink(
      'Do the Tutorial',
      'https://www.meteor.com/tutorials/react/creating-an-app',
    )

    insertLink('Follow the Guide', 'http://guide.meteor.com')

    insertLink('Read the Docs', 'https://docs.meteor.com')

    insertLink('Discussions', 'https://forums.meteor.com')
  }

  RandomCollection.remove({})

  let counter = 1

  new Array(1000)
    .fill(null)
    .map(() => ({
      name: 'Lorem Ipsum '.concat(String(counter)),
      number: counter++,
    }))
    .forEach(item => {
      RandomCollection.insert(item)
    })

  replaceFixtureData(FixtureProjects, makeProjects())
  replaceFixtureData(FixtureTasks, makeTasks())
  replaceFixtureData(FixtureEvents, makeEvents())
  replaceFixtureData(FixtureRemote, makeRemoteRecords())
})

Meteor.publish('fixture.projects', function () {
  return FixtureProjects.find({}, { sort: { ordinal: 1 } })
})

Meteor.publish('fixture.tasks', function (projectId, limit = 50) {
  check(projectId, String)
  check(limit, Match.Integer)

  if (!/^project-\d{2}$/.test(projectId) || limit < 1 || limit > MAX_TASK_LIMIT) {
    throw new Meteor.Error(
      'fixture-invalid-task-query',
      `Expected a fixture project id and a limit from 1 to ${MAX_TASK_LIMIT}`,
    )
  }

  return FixtureTasks.find(
    { projectId },
    { sort: { ordinal: 1 }, limit },
  )
})

Meteor.publish('fixture.dashboard', function () {
  return [
    FixtureProjects.find({}, { sort: { ordinal: 1 } }),
    FixtureTasks.find({}, { sort: { ordinal: 1 } }),
    FixtureEvents.find({}, { sort: { sequence: 1 } }),
  ]
})

Meteor.publish('fixture.tasks.overlap', function () {
  return FixtureTasks.find(
    { projectId: { $in: ['project-01', 'project-02'] } },
    { sort: { ordinal: 1 } },
  )
})

Meteor.publish('fixture.empty', function () {
  return []
})

Meteor.publish('fixture.delayed', function () {
  const timer = Meteor.setTimeout(() => this.ready(), DELAY_MS)
  this.onStop(() => Meteor.clearTimeout(timer))
})

Meteor.publish('fixture.rejected', function () {
  throw new Meteor.Error(
    'fixture-publication-failure',
    'Controlled fixture publication failure',
    'fixture.rejected requested a stable failure',
  )
})

Meteor.publish('fixture.remote', function () {
  return FixtureRemote.find({}, { sort: { ordinal: 1 } })
})

Meteor.publish('random1to100', function () {
  return RandomCollection.find({
    number: { $gte: 1, $lte: 100 },
  })
})

Meteor.publish('random101to200', function () {
  return RandomCollection.find({
    number: { $gte: 101, $lte: 200 },
  })
})

Meteor.publish('random201to300', function () {
  return RandomCollection.find({
    number: { $gte: 201, $lte: 300 },
  })
})

Meteor.publish('random301to400', function () {
  return RandomCollection.find({
    number: { $gte: 301, $lte: 400 },
  })
})

Meteor.publish('random401to500', function () {
  return RandomCollection.find({
    number: { $gte: 401, $lte: 500 },
  })
})

Meteor.publish('random501to600', function () {
  return RandomCollection.find({
    number: { $gte: 501, $lte: 600 },
  })
})

Meteor.publish('random601to700', function () {
  return RandomCollection.find({
    number: { $gte: 601, $lte: 700 },
  })
})

Meteor.publish('random701to800', function () {
  return RandomCollection.find({
    number: { $gte: 701, $lte: 800 },
  })
})

Meteor.publish('random801to900', function () {
  return RandomCollection.find({
    number: { $gte: 801, $lte: 900 },
  })
})

Meteor.publish('random901to1000', function () {
  return RandomCollection.find({
    number: { $gte: 901, $lte: 1000 },
  })
})

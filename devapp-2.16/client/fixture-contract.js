import { Meteor } from 'meteor/meteor'
import {
  FixtureEvents,
  FixtureProjects,
  FixtureTasks,
} from '../imports/api/fixture-collections'
import {
  FIXTURE_COLLECTION_NAMES, FIXTURE_CONTRACT_VERSION, FIXTURE_COUNTS,
  FIXTURE_METHODS, FIXTURE_MUTATION_ID, FIXTURE_PUBLICATIONS,
} from '../imports/api/fixture-data'
import { RandomCollection } from '../imports/api/random'
import { FixtureRemote, remoteReady } from './additional-connection'
import { FixtureClientOps, runLocalPerformanceScenario } from './local-collections'

export const STATUS_EVENT = 'meteor-devtools-fixture-status'
const WAIT_TIMEOUT_MS = 30_000
const LEGACY_RANDOM_PUBLICATIONS = Object.freeze([
  'random1to100',
  'random101to200',
  'random201to300',
  'random301to400',
  'random401to500',
  'random501to600',
  'random601to700',
  'random701to800',
  'random801to900',
  'random901to1000',
])
const transientSubscriptions = new Set()
const status = {
  ready: false, activeScenario: null, lastScenario: null, lastResult: null,
  lastError: null, baseline: { projects: 0, tasks: 0, events: 0 },
  secondary: { ready: false, count: 0 }, updatedAt: null,
}

export const getStatus = () => JSON.parse(JSON.stringify(status))
const serializeError = error => ({
  error: error?.error || 'fixture-unknown-error',
  reason: error?.reason || String(error),
  details: error?.details || null,
})
const snapshotCounts = () => {
  status.baseline = {
    projects: FixtureProjects.find().count(),
    tasks: FixtureTasks.find({ _id: { $ne: FIXTURE_MUTATION_ID } }).count(),
    events: FixtureEvents.find().count(),
  }
  status.secondary = { ready: status.secondary.ready, count: FixtureRemote.find().count() }
}
const publishStatus = () => {
  snapshotCounts()
  status.updatedAt = new Date().toISOString()
  window.dispatchEvent(new CustomEvent(STATUS_EVENT, { detail: getStatus() }))
}
const callMethod = (name, ...args) => new Promise((resolve, reject) => {
  Meteor.call(name, ...args, (error, result) => error ? reject(error) : resolve(result))
})
const waitFor = (predicate, description) => new Promise((resolve, reject) => {
  const startedAt = Date.now()
  const timer = Meteor.setInterval(() => {
    if (predicate()) {
      Meteor.clearInterval(timer)
      resolve()
    } else if (Date.now() - startedAt >= WAIT_TIMEOUT_MS) {
      Meteor.clearInterval(timer)
      reject(new Error(`Timed out waiting for ${description}`))
    }
  }, 20)
})
const runScenario = async (name, operation) => {
  status.activeScenario = name
  status.lastError = null
  publishStatus()
  try {
    const result = await operation()
    status.lastScenario = name
    status.lastResult = result
    return result
  } catch (error) {
    status.lastScenario = name
    status.lastError = serializeError(error)
    throw error
  } finally {
    status.activeScenario = null
    publishStatus()
  }
}
const subscribeUntilReady = (name, ...args) => new Promise((resolve, reject) => {
  let handle
  handle = Meteor.subscribe(name, ...args, {
    onReady() { transientSubscriptions.add(handle); resolve(handle) },
    onError(error) { reject(error) },
  })
})

const structuredEcho = (payload = {
  text: 'Structured echo · Olá 東京', nested: { enabled: true, values: [0, -1, null, 'four'] },
  sentAt: new Date(Date.UTC(2024, 0, 2)),
}) => runScenario('structuredEcho', () => callMethod('fixture.echo', payload))
const complexValues = () => runScenario('complexValues', () => callMethod('fixture.values'))
const delayedSuccess = (delayMs = 150) => runScenario('delayedSuccess', () =>
  callMethod('fixture.delayed', { scenario: 'delayed-success' }, delayMs))
const methodFailure = () => runScenario('methodFailure', async () => {
  try {
    await callMethod('fixture.fail')
    throw new Error('fixture.fail unexpectedly succeeded')
  } catch (error) {
    if (error.error !== 'fixture-method-failure') throw error
    return serializeError(error)
  }
})
const mutationLifecycle = () => runScenario('mutationLifecycle', async () => {
  await callMethod('fixture.mutation.reset')
  const inserted = await callMethod('fixture.mutation.insert')
  await waitFor(() => Boolean(FixtureTasks.findOne(FIXTURE_MUTATION_ID)), 'mutation insert')
  const updated = await callMethod('fixture.mutation.update')
  await waitFor(() => FixtureTasks.findOne(FIXTURE_MUTATION_ID)?.status === 'done', 'mutation update')
  const removed = await callMethod('fixture.mutation.remove')
  await waitFor(() => !FixtureTasks.findOne(FIXTURE_MUTATION_ID), 'mutation removal')
  return { inserted, updated, removed }
})
const publicationLifecycle = () => runScenario('publicationLifecycle', async () => {
  const handles = []
  for (const invocation of [
    ['fixture.empty'], ['fixture.delayed'], ['fixture.tasks.overlap'],
    ['fixture.tasks', 'project-01', 5],
  ]) handles.push(await subscribeUntilReady(...invocation))
  let rejected
  try {
    await subscribeUntilReady('fixture.rejected')
    throw new Error('fixture.rejected unexpectedly became ready')
  } catch (error) {
    if (error.error !== 'fixture-publication-failure') throw error
    rejected = serializeError(error)
  } finally {
    handles.forEach(handle => { handle.stop(); transientSubscriptions.delete(handle) })
  }
  return { ready: ['fixture.empty', 'fixture.delayed', 'fixture.tasks.overlap', 'fixture.tasks'], rejected }
})
const burst = (count = 12) => runScenario('burst', async () => {
  const results = []
  for (let index = 0; index < count; index += 1) {
    results.push(await callMethod('fixture.burst', 1))
  }
  return { count: results.length, first: results[0] }
})
const localPerformance = () => runScenario('localPerformance', async () => runLocalPerformanceScenario())
const reset = () => runScenario('reset', async () => {
  transientSubscriptions.forEach(handle => handle.stop())
  transientSubscriptions.clear()
  FixtureClientOps.remove({})
  await callMethod('fixture.mutation.reset')
  return { reset: true }
})
const waitUntilReady = async () => {
  if (!status.ready) await waitFor(() => status.ready, 'fixture readiness')
  return getStatus()
}

export const fixtureContract = {
  contractVersion: FIXTURE_CONTRACT_VERSION,
  metadata: {
    generation: '2.16', counts: FIXTURE_COUNTS, collections: FIXTURE_COLLECTION_NAMES,
    publications: FIXTURE_PUBLICATIONS, methods: FIXTURE_METHODS,
  },
  getStatus, waitUntilReady, structuredEcho, complexValues, delayedSuccess,
  methodFailure, mutationLifecycle, publicationLifecycle, burst, localPerformance, reset,
}
globalThis.__meteorDevtoolsFixture = fixtureContract

Meteor.startup(async () => {
  const baseline = Meteor.subscribe('fixture.dashboard')
  Meteor.subscribe('fixture.projects')
  const legacyRandomSubscriptions = LEGACY_RANDOM_PUBLICATIONS.map(
    publication => Meteor.subscribe(publication),
  )
  await remoteReady
  status.secondary.ready = true
  await waitFor(
    () =>
      baseline.ready() &&
      FixtureProjects.find().count() === FIXTURE_COUNTS.projects &&
      FixtureTasks.find().count() === FIXTURE_COUNTS.tasks &&
      FixtureEvents.find().count() === FIXTURE_COUNTS.events &&
      FixtureRemote.find().count() === FIXTURE_COUNTS.remote &&
      legacyRandomSubscriptions.every(handle => handle.ready()) &&
      RandomCollection.find().count() === 1_000,
    'deterministic fixture data',
  )
  status.ready = true
  publishStatus()
})

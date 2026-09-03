import { Meteor } from 'meteor/meteor'
import { Events, FIXTURE_COLLECTION_NAMES, FIXTURE_CONTRACT_VERSION, FIXTURE_COUNTS, FIXTURE_METHODS, FIXTURE_PUBLICATIONS, Projects, Tasks } from '/imports/api/fixture-contract'
import { RemoteCollection, remoteSubscription } from './additional-connection'
import { ClientOps, initializeLocalCollections } from './local-collections'

const SCENARIO_TIMEOUT_MS = 5_000
const listeners = new Set()
let status = { ready: false, activeScenario: null, lastScenario: null, lastResult: null, lastError: null, updatedAt: new Date().toISOString() }

const snapshot = () => ({
  ...status,
  baseline: { projects: Projects.find().count(), tasks: Tasks.find().count(), events: Events.find().count() },
  secondary: { ready: remoteSubscription.ready(), count: RemoteCollection.find().count() },
})

const publishStatus = (patch = {}) => {
  status = { ...status, ...patch, updatedAt: new Date().toISOString() }
  const value = snapshot()
  listeners.forEach((listener) => listener(value))
  return value
}

async function runScenario(name, operation) {
  publishStatus({ activeScenario: name, lastError: null })
  try {
    const result = await operation()
    publishStatus({ activeScenario: null, lastScenario: name, lastResult: result })
    return result
  } catch (error) {
    const normalized = { error: error?.error ?? 'unknown', reason: error?.reason ?? error?.message ?? String(error), details: error?.details ?? null }
    publishStatus({ activeScenario: null, lastScenario: name, lastResult: null, lastError: normalized })
    throw error
  }
}

function settledSubscription(name, ...parameters) {
  return new Promise((resolve, reject) => {
    let subscription
    const timeout = setTimeout(() => { subscription?.stop(); reject(new Error(`Timed out waiting for ${name}`)) }, SCENARIO_TIMEOUT_MS)
    subscription = Meteor.subscribe(name, ...parameters, {
      onReady() { clearTimeout(timeout); resolve(subscription) },
      onError(error) { clearTimeout(timeout); reject(error) },
    })
  })
}

export const fixtureApi = {
  contractVersion: FIXTURE_CONTRACT_VERSION,
  metadata: { generation: 'meteor-3', counts: FIXTURE_COUNTS, collections: FIXTURE_COLLECTION_NAMES, publications: FIXTURE_PUBLICATIONS, methods: FIXTURE_METHODS },
  getStatus: () => snapshot(),
  waitUntilReady: () => new Promise((resolve) => {
    if (snapshot().ready) return resolve(snapshot())
    const listener = (nextStatus) => {
      if (nextStatus.ready) {
        listeners.delete(listener)
        resolve(nextStatus)
      }
    }
    listeners.add(listener)
  }),
  structuredEcho: (payload = { nested: { value: 42 }, tags: ['fixture', 'echo'], nullable: null }) => runScenario('structuredEcho', () => Meteor.callAsync('fixture.echo', payload)),
  complexValues: () => runScenario('complexValues', () => Meteor.callAsync('fixture.values')),
  delayedSuccess: (delayMs = 100) => runScenario('delayedSuccess', () => Meteor.callAsync('fixture.delayed', delayMs)),
  methodFailure: () => runScenario('methodFailure', async () => {
    try { await Meteor.callAsync('fixture.fail') } catch (error) { return { error: error.error, reason: error.reason, details: error.details } }
    throw new Error('Expected fixture.fail to reject')
  }),
  mutationLifecycle: () => runScenario('mutationLifecycle', async () => ({
    inserted: await Meteor.callAsync('fixture.mutation.insert'),
    updated: await Meteor.callAsync('fixture.mutation.update'),
    removed: await Meteor.callAsync('fixture.mutation.remove'),
  })),
  publicationLifecycle: () => runScenario('publicationLifecycle', async () => {
    const overlap = await settledSubscription('fixture.tasks.overlap'); overlap.stop()
    const empty = await settledSubscription('fixture.empty'); empty.stop()
    const delayed = await settledSubscription('fixture.delayed', 100); delayed.stop()
    let rejected
    try { await settledSubscription('fixture.rejected') } catch (error) { rejected = { error: error.error, reason: error.reason, details: error.details } }
    return { overlap: 'stopped', empty: 'stopped', delayed: 'stopped', rejected }
  }),
  burst: (count = 12) => runScenario('burst', async () => {
    const results = await Promise.all(Array.from({ length: count }, () => Meteor.callAsync('fixture.burst', 1)))
    return { count: results.length }
  }),
  localPerformance: () => runScenario('localPerformance', async () => {
    await ClientOps.removeAsync({})
    await ClientOps.insertAsync({ _id: 'client-op', step: 'inserted', nested: { value: 1 } })
    await ClientOps.updateAsync('client-op', { $set: { step: 'updated', 'nested.value': 2 } })
    const updated = ClientOps.findOne('client-op')
    await ClientOps.removeAsync('client-op')
    return { updated, finalCount: ClientOps.find().count() }
  }),
  reset: () => runScenario('reset', async () => {
    await Meteor.callAsync('fixture.mutation.reset'); await ClientOps.removeAsync({}); return { reset: true }
  }),
  subscribe(listener) { listeners.add(listener); listener(snapshot()); return () => listeners.delete(listener) },
}

export async function initializeFixtureClient() {
  await initializeLocalCollections()
  Meteor.subscribe('fixture.dashboard', {
    onReady() { publishStatus({ ready: true }) },
    onError(error) { publishStatus({ lastError: { error: error.error, reason: error.reason, details: error.details } }) },
  })
  Meteor.subscribe('fixture.tasks', { projectId: 'project-00', limit: 25 })
  globalThis.__meteorDevtoolsFixture = fixtureApi
  publishStatus()
}

import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'

const ACCOUNT_LABELS = Object.freeze(['Account A', 'Account B'])
const ACCOUNT_IDS = Object.freeze(ACCOUNT_LABELS.map((_, index) => `playground-account-${index + 1}`))
const DOCUMENT_COLLECTION = 'playground_documents'
const AMBIENT_COLLECTION = 'playground_ambient'
const MAX_DELAY_MS = 5_000
const MAX_COUNTER_KEYS = 1_000
const invocationCounts = new Map()
const ambientContexts = new Map()
const activeProbes = new Map()

/**
 * This passwordless login handler exists only in the local development fixtures.
 * Real Accounts login/resume machinery generates and validates its session tokens.
 * The extension does not import or package any fixture server code.
 */
const accountsReady = Promise.all(ACCOUNT_IDS.map(async (userId, index) => {
  if (!await Accounts.users.findOneAsync(userId)) {
    await Accounts.users.insertAsync({ _id: userId, username: ACCOUNT_LABELS[index], createdAt: new Date(0) })
  }
}))

Accounts.registerLoginHandler('playground-fixture', async options => {
  if (!Object.prototype.hasOwnProperty.call(options, 'playgroundFixtureAccount')) return undefined
  const index = ACCOUNT_LABELS.indexOf(options.playgroundFixtureAccount)
  if (index < 0) throw new Meteor.Error('playground-invalid-account', 'Choose Account A or Account B')
  await accountsReady
  return { userId: ACCOUNT_IDS[index] }
})

const validateOwner = ownerId => {
  if (!ACCOUNT_IDS.includes(ownerId)) throw new Meteor.Error('playground-invalid-owner', 'Unknown fixture account')
}

const validateCounterKey = key => {
  if (typeof key !== 'string' || key.length === 0 || key.length > 100) {
    throw new Meteor.Error('playground-invalid-key', 'Counter keys must contain 1–100 characters')
  }
}

Meteor.methods({
  'playground.identity'() {
    return { userId: this.userId, connectionId: this.connection?.id ?? null }
  },
  'playground.access'(ownerId, enforce = true) {
    validateOwner(ownerId)
    if (enforce !== false && this.userId !== ownerId) {
      throw new Meteor.Error('playground-forbidden', 'This fixture record belongs to another account')
    }
    return { ownerId, value: `Record for ${ownerId}`, viewedBy: this.userId }
  },
  async 'playground.delayed'(key, delayMs) {
    validateCounterKey(key)
    if (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > MAX_DELAY_MS) {
      throw new Meteor.Error('playground-invalid-delay', `Delay must be between 0 and ${MAX_DELAY_MS} ms`)
    }
    if (!invocationCounts.has(key) && invocationCounts.size >= MAX_COUNTER_KEYS) {
      throw new Meteor.Error('playground-counter-limit', 'Restart the fixture to reset invocation counters')
    }
    const count = (invocationCounts.get(key) ?? 0) + 1
    invocationCounts.set(key, count)
    this.unblock()
    await new Promise(resolve => Meteor.setTimeout(resolve, delayMs))
    return { key, count, userId: this.userId }
  },
  'playground.invocations'(key) {
    validateCounterKey(key)
    return invocationCounts.get(key) ?? 0
  },
})

/**
 * Exercise automatic publication attribution without adding baseline documents.
 * A connection receives ambient data only while an explicit playground probe is
 * active; it is emitted by this automatic publication, not by that probe.
 */
Meteor.publish(null, function () {
  const connectionId = this.connection.id
  ambientContexts.set(connectionId, this)
  this.ready()
  this.onStop(() => {
    if (ambientContexts.get(connectionId) === this) ambientContexts.delete(connectionId)
  })
})

Meteor.publish('playground.documents', function (ownerId, enforce = true) {
  validateOwner(ownerId)
  if (enforce !== false && this.userId !== ownerId) {
    throw new Meteor.Error('playground-forbidden', 'This fixture publication belongs to another account')
  }
  const connectionId = this.connection.id
  const count = activeProbes.get(connectionId) ?? 0
  activeProbes.set(connectionId, count + 1)
  if (count === 0) ambientContexts.get(connectionId)?.added(AMBIENT_COLLECTION, 'ambient', { kind: 'automatic-publication' })
  this.onStop(() => {
    const remaining = (activeProbes.get(connectionId) ?? 1) - 1
    if (remaining > 0) activeProbes.set(connectionId, remaining)
    else {
      activeProbes.delete(connectionId)
      ambientContexts.get(connectionId)?.removed(AMBIENT_COLLECTION, 'ambient')
    }
  })
  for (let index = 0; index < 3; index += 1) {
    this.added(DOCUMENT_COLLECTION, `${ownerId}-${index}`, { ownerId, sequence: index, viewedBy: this.userId })
  }
  this.ready()
})

Meteor.publish('playground.neverReady', function () {
  // Deliberately omit ready to exercise timeout and owned-subscription cleanup.
})

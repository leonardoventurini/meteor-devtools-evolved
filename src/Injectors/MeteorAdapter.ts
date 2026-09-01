/* eslint-disable unicorn/no-this-outside-of-class -- Collection prototype wrappers must preserve Meteor's runtime receiver. */
import { Registry, sendMessage } from '@/Browser/Inject'
import { getSubscriptions } from '@/Browser/MeteorLibrary'
import { JSONUtils } from '@/Utils/JSONUtils'

const SYNCHRONOUS_COLLECTION_METHODS = [
  'find',
  'findOne',
  'insert',
  'update',
  'upsert',
  'remove',
] as const
const ASYNCHRONOUS_COLLECTION_METHODS = [
  'findOneAsync',
  'insertAsync',
  'updateAsync',
  'upsertAsync',
  'removeAsync',
] as const
const INSTRUMENTED_METHOD = Symbol('meteor-devtools-instrumented-method')

type CollectionPrototype = Record<string, CollectionMethod | undefined>
type CollectionInstance = { _name?: string | null }
type CollectionMethod = (
  this: CollectionInstance,
  ...args: unknown[]
) => unknown
type PerformanceSender = (data: CallData) => void
type Clock = () => number

const serializeArguments = (args: unknown[]): string =>
  JSON.stringify(args, JSONUtils.getCircularReplacer())

const instrumentMethod = (
  prototype: CollectionPrototype,
  key: string,
  timing: CallData['timing'],
  send: PerformanceSender,
  now: Clock,
) => {
  const original = prototype[key]

  if (typeof original !== 'function' || INSTRUMENTED_METHOD in original) {
    return
  }

  const wrapped: CollectionMethod = function (...args) {
    const startMs = now()
    const record = () => {
      send({
        collectionName: this._name ?? '(unnamed)',
        key,
        args: serializeArguments(args),
        runtime: now() - startMs,
        timing,
      })
    }

    if (timing === 'async') {
      try {
        return Promise.resolve(original.apply(this, args)).then(
          value => {
            record()
            return value
          },
          error => {
            record()
            throw error
          },
        )
      } catch (error) {
        record()
        throw error
      }
    }

    try {
      const result = original.apply(this, args)
      record()
      return result
    } catch (error) {
      record()
      throw error
    }
  }

  Object.defineProperty(wrapped, INSTRUMENTED_METHOD, { value: true })
  prototype[key] = wrapped
}

export const instrumentCollectionPrototype = (
  prototype: CollectionPrototype,
  send: PerformanceSender,
  now: Clock = Date.now,
) => {
  for (const key of SYNCHRONOUS_COLLECTION_METHODS) {
    instrumentMethod(prototype, key, 'sync', send, now)
  }

  for (const key of ASYNCHRONOUS_COLLECTION_METHODS) {
    instrumentMethod(prototype, key, 'async', send, now)
  }
}

export const MeteorAdapter = () => {
  Registry.register('ddp-run-method', (message: Message<any>) => {
    const { method, params } = message.data

    Meteor.call(method, ...params)
  })

  Registry.register('sync-subscriptions', () => {
    sendMessage('sync-subscriptions', {
      subscriptions: getSubscriptions(),
    })
  })

  Registry.register('stats', () => {
    sendMessage('stats', {
      gitCommitHash: Meteor.gitCommitHash,
    })
  })

  Registry.register('cache:clear', () => {
    sendMessage('cache:clear', {})
  })

  instrumentCollectionPrototype(Mongo.Collection.prototype, data => {
    sendMessage('meteor-data-performance', data)
  })
}

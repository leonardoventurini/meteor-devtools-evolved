import { Registry, sendMessage } from '@/Browser/Inject'
import { getSubscriptions } from '@/Browser/MeteorLibrary'
import isFunction from 'lodash/isFunction'
import { JSONUtils } from '@/Utils/JSONUtils'

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

  const prototype = Mongo.Collection.prototype

  Object.entries(prototype).forEach(([key, val]) => {
    if (
      ['find', 'findOne', 'insert', 'update', 'upsert', 'remove'].includes(
        key,
      ) &&
      isFunction(val)
    ) {
      const original = prototype[key]

      prototype[key] = function (...args) {
        const startMs = Date.now()
        const result = original.apply(this, args)

        sendMessage('meteor-data-performance', {
          collectionName: this._name,
          key,
          args: JSON.stringify(args, JSONUtils.getCircularReplacer()),
          runtime: Date.now() - startMs,
        })

        return result
      }
    }
  })
}

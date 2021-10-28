import { Registry, sendMessage } from '@/Browser/Inject'
import { getSubscriptions } from '@/Browser/MeteorLibrary'
import { isFunction } from 'lodash'

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
    if (isFunction(val)) {
      const original = prototype[key]
      prototype[key] = function (...args) {
        const startMs = performance.now()
        const result = original.apply(this, args)
        console.log(key, JSON.stringify(args), performance.now() - startMs)
        return result
      }
    }
  })
}

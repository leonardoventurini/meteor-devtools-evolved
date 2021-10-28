import { warning } from '@/Log'
import { Registry, sendMessage } from '@/Browser/Inject'
import { throttle } from 'lodash'

const cleanup = (object: any) => {
  Object.keys(object).forEach((key: string) => {
    if (object[key] instanceof Date) {
      object[key] = object[key].toString()
    }
  })

  return object
}

const getCollections = () => {
  const collections = Meteor.connection._mongo_livedata_collections

  if (!collections) {
    warning(
      'Collections not initialized in the client yet. Possibly forgotten to be imported.',
    )
    return
  }

  const data = Object.values(collections).reduce(
    (acc: object, collection: any) =>
      Object.assign(acc, {
        [collection.name]: Array.from(collection._docs._map.values()).map(
          cleanup,
        ),
      }),
    {},
  )

  sendMessage('minimongo-get-collections', data)
}

export const updateCollections = throttle(getCollections, 100, {
  leading: true,
  trailing: true,
})

export const MinimongoInjector = () => {
  Registry.register('minimongo-get-collections', () => {
    getCollections()
  })
}

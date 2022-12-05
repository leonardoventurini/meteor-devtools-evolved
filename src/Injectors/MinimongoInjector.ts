import { warning } from '@/Log'
import { Registry, sendMessage } from '@/Browser/Inject'
import cloneDeep from 'lodash/cloneDeep'
import throttle from 'lodash/throttle'
import { isArray } from 'lodash'

const cleanup = (object: any) => {
  if (typeof object !== 'object') return object

  const clonedObject = cloneDeep(object)

  Object.keys(clonedObject).forEach((key: string) => {
    if (!clonedObject[key]) {
      return
    }

    if (typeof clonedObject[key] === 'object') {
      if (isArray(clonedObject[key])) {
        clonedObject[key] = clonedObject[key].map((item: any) => cleanup(item))
        return
      }

      if (clonedObject[key] instanceof Date) {
        clonedObject[key] = `[Object::${
          clonedObject[key].constructor.name
        }] ${clonedObject[key].toISOString()}`
        return
      }

      if (clonedObject[key].constructor.name !== 'Object') {
        if (typeof clonedObject[key].toString === 'function') {
          clonedObject[key] = `[Object::${
            clonedObject[key].constructor.name
          }] ${clonedObject[key].toString()}`
          return
        } else {
          clonedObject[key] = `[Object::${clonedObject[key].constructor.name}]`
          return
        }
      }

      clonedObject[key] = cleanup(clonedObject[key])
    }
  })

  return clonedObject
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
        [collection.name]: Array.from(
          collection._docs._map?.values?.() ?? [],
        ).map(cleanup),
      }),
    {},
  )

  sendMessage('minimongo-get-collections', data as any)
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

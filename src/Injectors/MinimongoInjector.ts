import { warning } from '@/Log'
import { Registry, sendMessage } from '@/Browser/Inject'
import throttle from 'lodash.throttle'

interface StructuredCloneScope {
  structuredClone<T>(value: T): T
}

function cloneDeep<T>(obj: T): T {
  return (
    globalThis as typeof globalThis & StructuredCloneScope
  ).structuredClone(obj)
}

function isArray(obj: any) {
  return Array.isArray(obj)
}

const cleanup = (object: any) => {
  if (typeof object !== 'object') return object

  const clonedObject = cloneDeep(object)

  if (!clonedObject) return clonedObject

  for (const key of Object.keys(clonedObject)) {
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
  }

  return clonedObject
}

const getDocs = (collection: any) => {
  return collection._docs._map instanceof Map
    ? collection._docs._map?.values() || []
    : Object.values(collection._docs._map || {})
}

const getCollections = () => {
  const collections = Meteor.connection._mongo_livedata_collections

  if (!collections) {
    warning(
      'Collections not initialized in the client yet. Possibly forgotten to be imported.',
    )
    return
  }

  const data = Object.fromEntries(
    Object.values(collections).map((collection: any) => [
      collection.name,
      [...getDocs(collection)].map(item => cleanup(item)),
    ]),
  )

  sendMessage('minimongo-get-collections', data as any)
}

export const updateCollections = throttle(getCollections, 1000, {
  leading: true,
  trailing: true,
})

export const MinimongoInjector = () => {
  Registry.register('minimongo-get-collections', () => {
    getCollections()
  })
}

import { warning } from '@/Log'
import { Registry, sendMessage } from '@/Browser/Inject'
import { cleanupDocument } from '@/Utils/Minimongo'

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
      [...getDocs(collection)].map(item => cleanupDocument(item)),
    ]),
  )

  sendMessage('minimongo-get-collections', data as any)
}

export const MinimongoInjector = () => {
  Registry.register('minimongo-get-collections', () => {
    getCollections()
  })
}

import { warning } from '@/Log'
import { Registry, sendMessage } from '@/Browser/Inject'
import { cleanupDocument } from '@/Utils/Minimongo'
import {
  createCollectionRegistry,
  installCollectionRegistry,
  type LocalCollectionLike,
  type MongoCollectionLike,
} from './CollectionRegistry'

const collectionRegistry = createCollectionRegistry()

const getDocs = (collection: LocalCollectionLike) => {
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

  const registeredCollections = collectionRegistry.list(collections)
  const data: MinimongoSnapshotPayload = {
    collections: Object.fromEntries(
      registeredCollections.map(({ collection, displayName }) => [
        displayName,
        [...getDocs(collection)].map(
          item => cleanupDocument(item) as IDocument,
        ),
      ]),
    ),
    metadata: Object.fromEntries(
      registeredCollections.map(({ actualName, displayName }) => [
        displayName,
        { actualName },
      ]),
    ),
  }

  sendMessage('minimongo-get-collections', data)
}

interface MongoNamespace {
  Collection: new (...args: unknown[]) => MongoCollectionLike
  _collections?: Map<unknown, MongoCollectionLike>
}

export const MinimongoInjector = () => {
  installCollectionRegistry(
    Mongo as unknown as MongoNamespace,
    collectionRegistry,
  )
  Registry.register('minimongo-get-collections', () => {
    getCollections()
  })
}

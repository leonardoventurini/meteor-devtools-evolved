import { Registry, sendMessage } from '@/Browser/Inject'
import { cleanupDocument } from '@/Utils/Minimongo'
import {
  createCollectionRegistry,
  installCollectionRegistry,
  type LocalCollectionLike,
  type MongoCollectionLike,
} from './CollectionRegistry'
import { getMeteorConnections } from './MeteorConnections'

const collectionRegistry = createCollectionRegistry()

const getDocs = (collection: LocalCollectionLike) => {
  return collection._docs._map instanceof Map
    ? collection._docs._map?.values() || []
    : Object.values(collection._docs._map || {})
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
  Registry.register('minimongo-get-collections', message => {
    const { connectionId } = message.data as ConnectionRequest
    const descriptor = getMeteorConnections().get(connectionId)

    if (!descriptor) return

    const collections = descriptor.connection._mongo_livedata_collections ?? {}
    const registeredCollections = collectionRegistry.list(collections, {
      connection: descriptor.connection,
      includeUnmanaged: connectionId === 'default',
    })

    const data: MinimongoSnapshotPayload = {
      connectionId,
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
  })
}

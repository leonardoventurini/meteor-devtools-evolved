export interface LocalCollectionLike {
  name?: string | null
  _docs: {
    _map?: Map<unknown, unknown> | Record<string, unknown>
  }
}

export interface MongoCollectionLike {
  _collection: LocalCollectionLike
  _connection?: object | null
  _name: string | null
}

export interface RegisteredCollection {
  actualName: string | null
  displayName: string
  collection: LocalCollectionLike
}

interface CollectionListOptions {
  connection: object
  includeUnmanaged?: boolean
}

const LOCAL_COLLECTION_PREFIX = 'Local collection'

export const createCollectionRegistry = () => {
  const registeredCollections: MongoCollectionLike[] = []
  const localLabels = new WeakMap<LocalCollectionLike, string>()
  let nextLocalId = 1

  const register = (collection: MongoCollectionLike): void => {
    if (
      registeredCollections.some(
        registered => registered._collection === collection._collection,
      )
    ) {
      return
    }

    registeredCollections.push(collection)

    if (collection._name === null) {
      localLabels.set(
        collection._collection,
        `${LOCAL_COLLECTION_PREFIX} ${nextLocalId}`,
      )
      nextLocalId += 1
    }
  }

  const list = (
    connectionCollections: Record<string, LocalCollectionLike>,
    options?: CollectionListOptions,
  ): RegisteredCollection[] => {
    const seen = new Set<LocalCollectionLike>()
    const collections: RegisteredCollection[] = []

    for (const [connectionName, collection] of Object.entries(
      connectionCollections,
    )) {
      seen.add(collection)
      collections.push({
        actualName: collection.name ?? connectionName,
        displayName: collection.name ?? connectionName,
        collection,
      })
    }

    for (const registered of registeredCollections) {
      if (seen.has(registered._collection)) continue
      if (options && registered._name === null && !options.includeUnmanaged) {
        continue
      }
      if (
        options &&
        registered._name !== null &&
        registered._connection !== options.connection
      ) {
        continue
      }

      seen.add(registered._collection)
      collections.push({
        actualName: registered._name,
        displayName:
          registered._name ??
          localLabels.get(registered._collection) ??
          `${LOCAL_COLLECTION_PREFIX} ${nextLocalId}`,
        collection: registered._collection,
      })
    }

    return collections
  }

  return { list, register }
}

export type CollectionRegistry = ReturnType<typeof createCollectionRegistry>

type MongoCollectionConstructor<T extends MongoCollectionLike> = new (
  ...args: any[]
) => T

interface MongoNamespace<T extends MongoCollectionLike> {
  Collection: MongoCollectionConstructor<T>
  _collections?: Map<unknown, T>
}

const instrumentedConstructors = new WeakSet<object>()

export const installCollectionRegistry = <T extends MongoCollectionLike>(
  mongo: MongoNamespace<T>,
  registry: CollectionRegistry,
): void => {
  for (const collection of mongo._collections?.values() ?? []) {
    registry.register(collection)
  }

  const OriginalCollection = mongo.Collection

  if (instrumentedConstructors.has(OriginalCollection)) return

  const InstrumentedCollection = new Proxy(OriginalCollection, {
    construct(target, args, newTarget) {
      const collection = Reflect.construct(target, args, newTarget) as T
      registry.register(collection)
      return collection
    },
  })

  instrumentedConstructors.add(InstrumentedCollection)
  mongo.Collection = InstrumentedCollection
}

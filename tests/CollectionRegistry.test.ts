import { describe, expect, it } from 'vitest'
import {
  createCollectionRegistry,
  installCollectionRegistry,
} from '../src/Injectors/CollectionRegistry'

const createLocalCollection = (name: string | null, id: string) => ({
  name,
  _docs: { _map: new Map([[id, { _id: id }]]) },
})

describe('Minimongo collection registry', () => {
  it('deduplicates named collections and assigns collision-free local labels', () => {
    const links = createLocalCollection('links', 'named-id')
    const firstLocal = createLocalCollection(null, 'local-1')
    const secondLocal = createLocalCollection(null, 'local-2')
    const registry = createCollectionRegistry()

    registry.register({ _collection: links, _name: 'links' })
    registry.register({ _collection: firstLocal, _name: null })
    registry.register({ _collection: secondLocal, _name: null })

    expect(registry.list({ links })).toEqual([
      { actualName: 'links', displayName: 'links', collection: links },
      {
        actualName: null,
        displayName: 'Local collection 1',
        collection: firstLocal,
      },
      {
        actualName: null,
        displayName: 'Local collection 2',
        collection: secondLocal,
      },
    ])
  })

  it('keeps local labels stable when registry order changes', () => {
    const firstLocal = createLocalCollection(null, 'local-1')
    const secondLocal = createLocalCollection(null, 'local-2')
    const registry = createCollectionRegistry()
    const firstOuter = { _collection: firstLocal, _name: null }
    const secondOuter = { _collection: secondLocal, _name: null }

    registry.register(firstOuter)
    registry.register(secondOuter)
    registry.register(firstOuter)

    expect(registry.list({}).map(item => item.displayName)).toEqual([
      'Local collection 1',
      'Local collection 2',
    ])
  })

  it('instruments future constructors while preserving static behavior', () => {
    class Collection {
      static getCollection = () => 'static-result'

      _collection: ReturnType<typeof createLocalCollection>
      _name: string | null

      constructor(name: string | null) {
        this._name = name
        this._collection = createLocalCollection(name, String(name))
      }
    }

    const mongo = {
      Collection,
      _collections: new Map<string | null, InstanceType<typeof Collection>>(),
    }
    const registry = createCollectionRegistry()

    installCollectionRegistry(mongo, registry)
    const first = new mongo.Collection(null)
    const second = new mongo.Collection(null)

    expect(first).toBeInstanceOf(Collection)
    expect(mongo.Collection.getCollection()).toBe('static-result')
    expect(registry.list({}).map(item => item.collection)).toEqual([
      first._collection,
      second._collection,
    ])
  })
})

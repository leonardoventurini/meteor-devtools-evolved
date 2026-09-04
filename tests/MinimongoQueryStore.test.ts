import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MINIMONGO_QUERY_INPUT,
  MinimongoStore,
} from '../src/Stores/Panel/MinimongoStore'
import { getQueryStorageKey } from '../src/Stores/Panel/MinimongoStore/QueryPersistence'

class MemoryStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

class UnavailableStorage {
  getItem(): never {
    throw new Error('Storage unavailable')
  }

  removeItem(): never {
    throw new Error('Storage unavailable')
  }

  setItem(): never {
    throw new Error('Storage unavailable')
  }
}

describe('Minimongo query store', () => {
  it('applies valid queries to the active captured documents', () => {
    const store = new MinimongoStore()
    store.setCollections({
      links: [
        { _id: 'a', rank: 2, title: 'Second' },
        { _id: 'b', rank: 1, title: 'First' },
      ],
    })
    store.setActiveCollection('links')

    store.applyQuery({
      limit: '1',
      projection: '{"title":1}',
      selector: '{}',
      sort: '{"rank":1}',
    })

    expect(store.queryError).toBeNull()
    expect(store.queriedDocuments.map(entry => entry.document)).toEqual([
      { _id: 'b', title: 'First' },
    ])
  })

  it('keeps the previous result contract when invalid input is rejected', () => {
    const store = new MinimongoStore()
    store.setCollections({ links: [{ _id: 'a', title: 'Safe' }] })

    store.applyQuery({
      limit: '100',
      projection: '{}',
      selector: '{"$where":"true"}',
      sort: '{}',
    })

    expect(store.query).toBeNull()
    expect(store.queryError).toContain('Unsupported selector operator')
    expect(store.queriedDocuments).toHaveLength(1)
  })

  it('restores applied queries and in-progress drafts after reload', () => {
    const storage = new MemoryStorage()
    const store = new MinimongoStore(storage)
    const applied = {
      limit: '1000',
      projection: '{name: 1}',
      selector: '{name: {$ne: null}}',
      sort: '{name: 1}',
    }

    store.applyQuery(applied)
    store.setQueryDraftField('selector', '{name:')

    const restored = new MinimongoStore(storage)

    expect(restored.queryInput).toEqual(applied)
    expect(restored.queryDraftInput.selector).toBe('{name:')
    expect(restored.query?.limit).toBe(1000)
  })

  it('isolates persisted state by connection and restores it when switching', () => {
    const storage = new MemoryStorage()
    const store = new MinimongoStore(storage)

    store.applyQuery({
      ...DEFAULT_MINIMONGO_QUERY_INPUT,
      selector: '{scope: "default"}',
    })
    store.setActiveConnectionId('connection-1')

    expect(store.query).toBeNull()
    expect(store.queryDraftInput).toEqual(DEFAULT_MINIMONGO_QUERY_INPUT)

    store.applyQuery({
      ...DEFAULT_MINIMONGO_QUERY_INPUT,
      selector: '{scope: "secondary"}',
    })
    store.setActiveConnectionId('default')

    expect(store.queryInput.selector).toBe('{scope: "default"}')
    expect(store.query?.selector).toEqual({ scope: 'default' })
  })

  it('clears only the active connection persisted state', () => {
    const storage = new MemoryStorage()
    const store = new MinimongoStore(storage)
    store.applyQuery({
      ...DEFAULT_MINIMONGO_QUERY_INPUT,
      selector: '{scope: "default"}',
    })
    store.setActiveConnectionId('connection-1')
    store.applyQuery({
      ...DEFAULT_MINIMONGO_QUERY_INPUT,
      selector: '{scope: "secondary"}',
    })

    store.clearQuery()
    store.setActiveConnectionId('default')

    expect(store.queryInput.selector).toBe('{scope: "default"}')
    store.setActiveConnectionId('connection-1')
    expect(store.query).toBeNull()
  })

  it('fails closed for corrupt persisted state', () => {
    const storage = new MemoryStorage()
    storage.setItem(getQueryStorageKey('panel', 'default'), '{not valid JSON')

    const store = new MinimongoStore(storage)

    expect(store.query).toBeNull()
    expect(store.queryDraftInput).toEqual(DEFAULT_MINIMONGO_QUERY_INPUT)
  })

  it('continues querying when local storage is unavailable', () => {
    const store = new MinimongoStore(new UnavailableStorage())

    expect(() =>
      store.applyQuery({
        ...DEFAULT_MINIMONGO_QUERY_INPUT,
        selector: '{name: "Ada"}',
      }),
    ).not.toThrow()
    expect(store.query?.selector).toEqual({ name: 'Ada' })
    expect(() => store.clearQuery()).not.toThrow()
  })

  it('isolates identical connection IDs across inspected tabs', () => {
    const storage = new MemoryStorage()
    const firstTab = new MinimongoStore(storage, 'tab-1')
    firstTab.applyQuery({
      ...DEFAULT_MINIMONGO_QUERY_INPUT,
      selector: '{scope: "first-tab"}',
    })

    const secondTab = new MinimongoStore(storage, 'tab-2')

    expect(secondTab.query).toBeNull()
    expect(secondTab.queryDraftInput).toEqual(DEFAULT_MINIMONGO_QUERY_INPUT)
  })
})

import { describe, expect, it } from 'vitest'
import { MinimongoStore } from '../src/Stores/Panel/MinimongoStore'

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
})

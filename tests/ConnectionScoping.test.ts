import { describe, expect, it } from 'vitest'
import {
  isLogForConnection,
  shouldAcceptConnectionPayload,
} from '../src/Injectors/ConnectionScoping'
import { createCollectionRegistry } from '../src/Injectors/CollectionRegistry'

const createLocalCollection = (name: string | null) => ({
  name,
  _docs: { _map: new Map() },
})

describe('connection-scoped panel data', () => {
  it('matches DDP logs only to their selected connection', () => {
    expect(isLogForConnection({ connectionId: 'default' }, 'default')).toBe(
      true,
    )
    expect(
      isLogForConnection({ connectionId: 'connection-1' }, 'default'),
    ).toBe(false)
  })

  it('isolates named collections by connection and local collections to default', () => {
    const defaultConnection = {}
    const additionalConnection = {}
    const defaultNamed = createLocalCollection('links')
    const additionalNamed = createLocalCollection('remoteLinks')
    const local = createLocalCollection(null)
    const registry = createCollectionRegistry()

    registry.register({
      _collection: defaultNamed,
      _connection: defaultConnection,
      _name: 'links',
    })
    registry.register({
      _collection: additionalNamed,
      _connection: additionalConnection,
      _name: 'remoteLinks',
    })
    registry.register({
      _collection: local,
      _connection: null,
      _name: null,
    })

    expect(
      registry
        .list({}, { connection: defaultConnection, includeUnmanaged: true })
        .map(item => item.displayName),
    ).toEqual(['links', 'Local collection 1'])
    expect(
      registry
        .list({}, { connection: additionalConnection })
        .map(item => item.displayName),
    ).toEqual(['remoteLinks'])
  })

  it('rejects stale snapshots after the selected connection changes', () => {
    expect(shouldAcceptConnectionPayload('connection-1', 'connection-1')).toBe(
      true,
    )
    expect(shouldAcceptConnectionPayload('default', 'connection-1')).toBe(false)
  })
})

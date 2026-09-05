/* eslint-disable unicorn/no-this-outside-of-class -- The proxy contract must preserve DDP.connect's receiver. */
import { describe, expect, it, vi } from 'vitest'
import {
  createConnectionRegistry,
  installDDPConnectRegistry,
} from '../src/Injectors/ConnectionRegistry'
import { initializeMeteorConnections } from '../src/Injectors/MeteorConnections'

describe('DDP connection registry', () => {
  it('recovers connections created before the injector from Mongo collections', () => {
    const defaultConnection = { name: 'default' }
    const existingConnection = { name: 'existing' }
    const ddp = { connect: () => ({ name: 'future' }) }
    const mongo = {
      _collections: new Map([
        ['default', { _connection: defaultConnection }],
        ['additional', { _connection: existingConnection }],
        ['local', { _connection: null }],
      ]),
    }

    const registry = initializeMeteorConnections(defaultConnection, ddp, mongo)

    expect(registry.list()).toEqual([
      expect.objectContaining({ id: 'default', connection: defaultConnection }),
      expect.objectContaining({
        id: 'connection-1',
        connection: existingConnection,
      }),
    ])
  })

  it('assigns stable identities without duplicate registrations', () => {
    const defaultConnection = { endpoint: 'default' }
    const additionalConnection = { endpoint: 'additional' }
    const registry = createConnectionRegistry(defaultConnection)

    registry.register(additionalConnection)
    registry.register(additionalConnection)

    expect(registry.list()).toEqual([
      {
        connection: defaultConnection,
        displayName: 'Default connection',
        id: 'default',
      },
      {
        connection: additionalConnection,
        displayName: 'Connection 1',
        id: 'connection-1',
      },
    ])
    expect(registry.get('connection-1')?.connection).toBe(additionalConnection)
  })

  it('notifies listeners once for each newly registered connection', () => {
    const registry = createConnectionRegistry({ endpoint: 'default' })
    const listener = vi.fn()
    const additionalConnection = { endpoint: 'additional' }

    registry.subscribe(listener)
    registry.register(additionalConnection)
    registry.register(additionalConnection)

    expect(listener).toHaveBeenCalledOnce()
    expect(listener.mock.calls[0][0]).toMatchObject({
      displayName: 'Connection 1',
      id: 'connection-1',
    })
  })

  it('registers DDP.connect results while preserving call behavior', () => {
    const connection = { endpoint: 'additional' }
    const connect = vi.fn(function (this: { marker: string }, url: string) {
      expect(this.marker).toBe('ddp')
      expect(url).toBe('https://example.test')
      return connection
    })
    const ddp = { connect, marker: 'ddp' }
    const registry = createConnectionRegistry({ endpoint: 'default' })

    installDDPConnectRegistry(ddp, registry)

    expect(ddp.connect('https://example.test')).toBe(connection)
    expect(registry.get('connection-1')?.connection).toBe(connection)
  })
})

describe('owned connections', () => {
  const owner = {
    parentConnectionId: 'default',
    pageEpoch: 'epoch',
    panelSessionId: 'panel',
    requestId: 'request',
  }

  it('marks ownership before notifying and excludes children from app selection', () => {
    const registry = createConnectionRegistry({ name: 'app' })
    const ddp = { connect: () => ({ name: 'owned' }) }
    installDDPConnectRegistry(ddp, registry)
    const listener = vi.fn(descriptor => {
      expect(descriptor.ownership).toEqual(owner)
      expect(registry.list()).toHaveLength(1)
    })
    registry.subscribe(listener)
    const descriptor = registry.createOwned(owner, () => ddp.connect())
    expect(descriptor.ownership).toEqual(owner)
    expect(registry.listOwned()).toEqual([descriptor])
    expect(listener).toHaveBeenCalledOnce()
    registry.disposeOwned(descriptor.id)
    registry.disposeOwned(descriptor.id)
    expect(registry.get(descriptor.id)).toBeUndefined()
    expect(registry.listOwned()).toEqual([])
    expect(() => registry.register(descriptor.connection)).toThrow(/disposed/)
    expect(() => registry.disposeOwned('default')).toThrow(/application/)
  })

  it('consumes ownership before nested construction and listener reentrancy', () => {
    const registry = createConnectionRegistry({ name: 'app' })
    const ddp = {
      connect: (nested = false): { name: string } => {
        if (!nested) ddp.connect(true)
        return { name: nested ? 'nested app' : 'owned' }
      },
    }
    installDDPConnectRegistry(ddp, registry)
    registry.subscribe(descriptor => {
      if (descriptor.ownership) registry.register({ name: 'listener app' })
    })
    registry.createOwned(owner, () => ddp.connect())
    expect(registry.list().map(item => item.connection.name)).toEqual([
      'app',
      'nested app',
      'listener app',
    ])
    expect(registry.listOwned().map(item => item.connection.name)).toEqual([
      'owned',
    ])
  })

  it('resets pending ownership after constructor failure and rejects existing app objects', () => {
    const app = { name: 'app' }
    const registry = createConnectionRegistry(app)
    expect(() =>
      registry.createOwned(owner, () => {
        throw new Error('constructor')
      }),
    ).toThrow('constructor')
    expect(registry.register({ name: 'later' }).ownership).toBeUndefined()
    expect(() => registry.createOwned(owner, () => app)).toThrow(/application/)
    expect(() =>
      registry.createOwned({ ...owner, parentConnectionId: 'missing' }, () => ({
        name: 'bad',
      })),
    ).toThrow(/parent/)
  })
})

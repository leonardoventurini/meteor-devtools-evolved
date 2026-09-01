/* eslint-disable unicorn/no-this-outside-of-class -- The proxy contract must preserve DDP.connect's receiver. */
import { describe, expect, it, vi } from 'vitest'
import {
  createConnectionRegistry,
  installDDPConnectRegistry,
} from '../src/Injectors/ConnectionRegistry'

describe('DDP connection registry', () => {
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

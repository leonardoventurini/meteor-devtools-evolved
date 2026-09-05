import { expect, it, vi } from 'vitest'
import {
  createConnectionRegistry,
  installDDPConnectRegistry,
} from '../src/Injectors/ConnectionRegistry'
import { createOwnedConnection } from '../src/Injectors/Playground/OwnedConnection'

const owner = {
  parentConnectionId: 'default',
  pageEpoch: 'epoch',
  panelSessionId: 'panel',
  requestId: 'request',
}

it('removes only its native online listener and permanently disconnects once', () => {
  const target = new EventTarget()
  const appOnline = vi.fn()
  const unrelated = vi.fn()
  target.addEventListener('online', appOnline)
  const stream = {
    _online() {
      unrelated()
    },
  }
  const disconnect = vi.fn()
  const connection = { _stream: stream, disconnect }
  const registry = createConnectionRegistry(connection)
  const originalAdd = target.addEventListener
  const owned = createOwnedConnection(
    registry,
    owner,
    () => {
      target.addEventListener('online', stream._online.bind(stream), false)
      target.addEventListener('resize', unrelated)
      return { _stream: stream, disconnect }
    },
    target,
  )
  expect(target.addEventListener).toBe(originalAdd)
  expect(registry.listOwned()).toHaveLength(1)
  owned.dispose()
  owned.dispose()
  target.dispatchEvent(new Event('online'))
  expect(appOnline).toHaveBeenCalledOnce()
  expect(unrelated).not.toHaveBeenCalled()
  target.dispatchEvent(new Event('resize'))
  expect(unrelated).toHaveBeenCalledOnce()
  expect(disconnect).toHaveBeenCalledExactlyOnceWith({ _permanent: true })
  expect(registry.listOwned()).toEqual([])
})

it('restores interception and removes native listener if construction throws', () => {
  const target = new EventTarget()
  const online = vi.fn()
  const stream = {
    _online() {
      online()
    },
  }
  const connection = { _stream: stream, disconnect: vi.fn() }
  const registry = createConnectionRegistry(connection)
  const originalAdd = target.addEventListener
  expect(() =>
    createOwnedConnection(
      registry,
      owner,
      () => {
        target.addEventListener('online', stream._online.bind(stream))
        throw new Error('failed construction')
      },
      target,
    ),
  ).toThrow('failed construction')
  expect(target.addEventListener).toBe(originalAdd)
  target.dispatchEvent(new Event('online'))
  expect(online).not.toHaveBeenCalled()
  expect(registry.listOwned()).toEqual([])
})

it('cleans registry and listeners even when transport disposal throws', () => {
  const target = new EventTarget()
  const stream = { _online() {} }
  const registry = createConnectionRegistry({
    _stream: stream,
    disconnect() {},
  })
  const owned = createOwnedConnection(
    registry,
    owner,
    () => {
      target.addEventListener('online', stream._online.bind(stream))
      return {
        _stream: stream,
        disconnect() {
          throw new Error('transport error')
        },
      }
    },
    target,
  )
  expect(() => owned.dispose()).toThrow('transport error')
  expect(registry.listOwned()).toEqual([])
  expect(() => owned.dispose()).not.toThrow()
})

it('does not remove a nested application constructor online listener', () => {
  const target = new EventTarget()
  const calls = { app: vi.fn(), owned: vi.fn() }
  const app = { _stream: { _online() {} }, disconnect() {} }
  const registry = createConnectionRegistry(app)
  const ddp = {
    connect(nested = false): typeof app {
      if (!nested) ddp.connect(true)
      const stream = {
        _online() {
          calls[nested ? 'app' : 'owned']()
        },
      }
      target.addEventListener('online', stream._online.bind(stream))
      return { _stream: stream, disconnect() {} }
    },
  }
  installDDPConnectRegistry(ddp, registry)
  const owned = createOwnedConnection(
    registry,
    owner,
    () => ddp.connect(),
    target,
  )
  owned.dispose()
  target.dispatchEvent(new Event('online'))
  expect(calls.app).toHaveBeenCalledOnce()
  expect(calls.owned).not.toHaveBeenCalled()
  expect(registry.list()).toHaveLength(2)
})

it('does not dispose an existing application connection returned by an invalid factory', () => {
  const target = new EventTarget()
  const disconnect = vi.fn()
  const app = { _stream: { _online() {} }, disconnect }
  const registry = createConnectionRegistry(app)
  expect(() =>
    createOwnedConnection(registry, owner, () => app, target),
  ).toThrow(/capability/)
  expect(disconnect).not.toHaveBeenCalled()
  expect(registry.list()).toHaveLength(1)
})

/* eslint-disable unicorn/no-this-outside-of-class -- Native stream and allocator mocks preserve their receivers. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createConnectionRegistry } from '../src/Injectors/ConnectionRegistry'
import { createNativeProvider } from '../src/Injectors/Playground/NativeProvider'
import type { RunCommand } from '../src/Playground/Commands'
import type { StreamCallback } from '../src/Injectors/Playground/StreamObserver'
const command = (
  authentication: 'anonymous' | 'reuse' = 'anonymous',
): RunCommand => ({
  kind: 'run',
  version: 1,
  panelSessionId: 'panel',
  pageEpoch: 'epoch',
  requestId: crypto.randomUUID(),
  connectionId: 'default',
  mode: 'isolated',
  authentication,
  operation: { kind: 'subscription', name: 'items', parameters: [] },
  sessionLabel: 'A',
  waitMs: 1000,
})
const connection = () => {
  let connected = true,
    userId: string | null = 'account'
  const stream = {
    rawUrl: 'https://selected.example',
    options: { retry: false } as Record<string, unknown>,
    eventCallbacks: {} as Record<string, StreamCallback[] | undefined>,
    _online() {},
    on(event: string, callback: StreamCallback) {
      ;(this.eventCallbacks[event] ??= []).push(callback)
    },
    send: vi.fn(),
  }
  return {
    _stream: stream,
    _methodInvokers: {},
    _subscriptions: {},
    status: () => ({ connected }),
    userId: () => userId,
    setUserId: (value: string | null) => {
      userId = value
    },
    setConnected: (value: boolean) => {
      connected = value
    },
    disconnect: vi.fn(() => {
      connected = false
    }),
    subscribe: vi.fn(() => ({ subscriptionId: 'sub', stop: vi.fn() })),
    apply: vi.fn(
      (
        _name: string,
        _args: unknown[],
        options: {
          onResultReceived: (error?: unknown, result?: unknown) => void
        },
      ) => {
        options.onResultReceived(undefined, { id: 'account' })
      },
    ),
    _apply(
      this: { _methodInvokers: Record<string, unknown> },
      _name: unknown,
      _stub: unknown,
      _args: unknown,
      options: { noRetry: boolean; onResultReceived: unknown },
    ) {
      this._methodInvokers['1'] = {
        noRetry: options.noRetry,
        _onResultReceived: options.onResultReceived,
      }
    },
  }
}
const setup = () => {
  const source = connection(),
    registry = createConnectionRegistry(source),
    target = new EventTarget()
  let owned: ReturnType<typeof connection> | undefined
  const accounts = {
    connection: source,
    loggingIn: () => false,
    _storedUserId: () => 'account',
    _storedLoginToken: () => 'secret-token',
    _lastLoginTokenWhenPolled: 'secret-token',
  }
  const connect = vi.fn(() => {
    owned = connection()
    target.addEventListener('online', owned._stream._online.bind(owned._stream))
    return owned
  })
  const provider = createNativeProvider({
    registry,
    connect,
    accounts: () => accounts,
    eventTarget: target,
  })
  return {
    source,
    registry,
    target,
    accounts,
    connect,
    provider,
    get owned() {
      return owned
    },
  }
}
afterEach(() => vi.useRealTimers())
describe('native playground targets', () => {
  it('resolves exact app identity while secondary and unsupported targets stay unknown or unavailable', () => {
    const state = setup(),
      secondary = connection()
    const id = state.registry.register(secondary).id
    expect(state.provider.resolveTarget('default')?.authentication.state).toBe(
      'authenticated',
    )
    expect(state.provider.resolveTarget(id)?.authentication.state).toBe(
      'unknown',
    )
    expect(state.provider.resolveTarget('missing')).toBeUndefined()
    state.source.setUserId(null)
    expect(state.provider.resolveTarget('default')?.authentication.state).toBe(
      'anonymous',
    )
  })
  it('constructs anonymous owned targets only at the selected endpoint and disposes ownership once', async () => {
    const state = setup(),
      source = state.provider.resolveTarget('default')!
    const owned = await state.provider.openIsolated(
      source,
      command(),
      new AbortController().signal,
    )
    expect(state.connect).toHaveBeenCalledWith('https://selected.example', {
      retry: false,
    })
    expect(owned.authentication.state).toBe('anonymous')
    expect(state.owned?.apply).not.toHaveBeenCalled()
    expect(
      state.provider.resolveTarget(state.registry.listOwned()[0]!.id),
    ).toBeUndefined()
    owned.dispose?.()
    owned.dispose?.()
    expect(state.owned?.disconnect).toHaveBeenCalledOnce()
    expect(state.source.disconnect).not.toHaveBeenCalled()
    expect(state.registry.listOwned()).toEqual([])
  })
  it('reuses only a proven source session and emits no token metadata', async () => {
    const state = setup(),
      source = state.provider.resolveTarget('default')!
    const owned = await state.provider.openIsolated(
      source,
      command('reuse'),
      new AbortController().signal,
    )
    expect(owned.authentication.state).toBe('authenticated')
    expect(JSON.stringify(owned.authentication)).not.toContain('secret-token')
    expect(state.owned?.apply).toHaveBeenCalledWith(
      'login',
      [{ resume: 'secret-token' }],
      expect.objectContaining({ noRetry: true }),
      expect.any(Function),
    )
    state.source.setUserId('other')
    expect(owned.sourceCurrent?.()).toBe(false)
    owned.dispose?.()
    expect(state.source.disconnect).not.toHaveBeenCalled()
  })
  it('refuses pre-aborted creation and disposes waiting transports on cancellation', async () => {
    const state = setup(),
      abort = new AbortController()
    abort.abort()
    await expect(
      state.provider.openIsolated(
        state.provider.resolveTarget('default')!,
        command(),
        abort.signal,
      ),
    ).rejects.toThrow()
    expect(state.connect).not.toHaveBeenCalled()
    state.connect.mockImplementation(() => {
      const owned = connection()
      owned.setConnected(false)
      state.target.addEventListener(
        'online',
        owned._stream._online.bind(owned._stream),
      )
      return owned
    })
    const controller = new AbortController(),
      pending = state.provider.openIsolated(
        state.provider.resolveTarget('default')!,
        command(),
        controller.signal,
      )
    controller.abort()
    await expect(pending).rejects.toThrow()
    expect(state.registry.listOwned()).toEqual([])
  })
  it('rejects stale source identity before creating a transport', async () => {
    const state = setup(),
      source = state.provider.resolveTarget('default')!
    state.source.setUserId('other')
    await expect(
      state.provider.openIsolated(
        source,
        command('reuse'),
        new AbortController().signal,
      ),
    ).rejects.toThrow()
    expect(state.connect).not.toHaveBeenCalled()
  })
})

it('marks login transitions unknown and invalidates a previously observed source', () => {
  const state = setup(),
    source = state.provider.resolveTarget('default')!
  state.accounts.loggingIn = () => true
  expect(source.sourceCurrent?.()).toBe(false)
  expect(state.provider.resolveTarget('default')?.authentication.state).toBe(
    'unknown',
  )
})
it('rejects custom headers and transport options without opening a connection', async () => {
  for (const options of [
    { headers: { Authorization: 'secret' } },
    { _sockjsOptions: { transports: ['websocket'] } },
    { connectTimeoutMs: 2000 },
    { customTransport: true },
  ]) {
    const state = setup()
    state.source._stream.options = options
    await expect(
      state.provider.openIsolated(
        state.provider.resolveTarget('default')!,
        command(),
        new AbortController().signal,
      ),
    ).rejects.toThrow('transport options')
    expect(state.connect).not.toHaveBeenCalled()
  }
})

it('captures ambient documents before connection readiness and releases baseline observers', async () => {
  vi.useFakeTimers()
  const state = setup()
  state.connect.mockImplementation(() => {
    const owned = connection()
    owned.setConnected(false)
    state.target.addEventListener(
      'online',
      owned._stream._online.bind(owned._stream),
    )
    setTimeout(() => {
      for (const callback of owned._stream.eventCallbacks.message ?? [])
        callback(
          JSON.stringify({
            msg: 'added',
            collection: 'ambient',
            id: 'one',
            fields: { value: 1 },
          }),
        )
      owned.setConnected(true)
    }, 10)
    return owned
  })
  const pending = state.provider.openIsolated(
    state.provider.resolveTarget('default')!,
    command(),
    new AbortController().signal,
  )
  await vi.advanceTimersByTimeAsync(50)
  const owned = await pending
  expect(owned.baseline).toEqual({ ambient: { one: { value: 1 } } })
  expect(owned.connection._stream.eventCallbacks.message).toEqual([])
  owned.dispose?.()
  expect(vi.getTimerCount()).toBe(0)
})
it('aborts an in-flight reuse login and disposes its timers and owned transport', async () => {
  vi.useFakeTimers()
  const state = setup(),
    abort = new AbortController()
  state.connect.mockImplementation(() => {
    const owned = connection()
    owned.apply.mockImplementation(() => {})
    state.target.addEventListener(
      'online',
      owned._stream._online.bind(owned._stream),
    )
    return owned
  })
  const pending = state.provider.openIsolated(
    state.provider.resolveTarget('default')!,
    command('reuse'),
    abort.signal,
  )
  await Promise.resolve()
  abort.abort()
  await expect(pending).rejects.toThrow('unavailable')
  expect(state.registry.listOwned()).toEqual([])
  expect(vi.getTimerCount()).toBe(0)
  expect(state.source.disconnect).not.toHaveBeenCalled()
})

it('disposes pending reuse when the source token changes without changing its user ID', async () => {
  vi.useFakeTimers()
  const state = setup()
  state.connect.mockImplementation(() => {
    const owned = connection()
    owned.apply.mockImplementation(() => {})
    state.target.addEventListener(
      'online',
      owned._stream._online.bind(owned._stream),
    )
    return owned
  })
  const pending = state.provider.openIsolated(
    state.provider.resolveTarget('default')!,
    command('reuse'),
    new AbortController().signal,
  )
  const result = expect(pending).rejects.toThrow('unavailable')
  await Promise.resolve()
  state.accounts._lastLoginTokenWhenPolled = 'changed-token'
  await vi.advanceTimersByTimeAsync(50)
  await result
  expect(state.registry.listOwned()).toEqual([])
  expect(vi.getTimerCount()).toBe(0)
})
it('cleans setup timers when an owned native status getter throws', async () => {
  vi.useFakeTimers()
  const state = setup()
  state.connect.mockImplementation(() => {
    const owned = connection()
    owned.status = () => {
      throw new Error('private-status-detail')
    }
    state.target.addEventListener(
      'online',
      owned._stream._online.bind(owned._stream),
    )
    return owned
  })
  await expect(
    state.provider.openIsolated(
      state.provider.resolveTarget('default')!,
      command(),
      new AbortController().signal,
    ),
  ).rejects.toThrow('unavailable')
  expect(vi.getTimerCount()).toBe(0)
  expect(state.registry.listOwned()).toEqual([])
})

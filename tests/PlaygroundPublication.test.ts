import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  startPublication,
  type PublicationSignal,
} from '../src/Injectors/Playground/PublicationAdapter'
import { getFrameProvenance } from '../src/Injectors/Playground/CaptureProvenance'
import type { StreamCallback } from '../src/Injectors/Playground/StreamObserver'

const setup = (
  mode: 'shared' | 'isolated' = 'shared',
  synchronousReady = false,
  waitMs = 10_000,
  synchronousChanges = false,
) => {
  const signals: PublicationSignal[] = []
  const stop = vi.fn()
  const appStop = vi.fn()
  const disposeConnection = vi.fn()
  let reactive = true
  const callbacks: Record<string, StreamCallback[]> = {
    message: [],
    disconnect: [],
  }
  const stream = {
    eventCallbacks: callbacks,
    on: (event: string, callback: StreamCallback) => {
      callbacks[event]!.push(callback)
    },
    send: vi.fn(),
  }
  const receive = (frame: unknown) => {
    for (const callback of callbacks.message!) callback(JSON.stringify(frame))
  }
  const nonreactive = vi.fn(<T>(action: () => T): T => action())
  const connection = {
    _stream: stream,
    status: () => ({ connected: true }),
    subscribe: vi.fn(() => {
      stream.send(
        JSON.stringify({ msg: 'sub', name: 'items', id: 'owned', params: [] }),
      )
      if (synchronousChanges)
        receive({
          msg: 'added',
          collection: 'items',
          id: 'one',
          fields: { value: 1 },
        })
      if (synchronousReady) receive({ msg: 'ready', subs: ['owned'] })
      if (synchronousChanges)
        receive({
          msg: 'changed',
          collection: 'items',
          id: 'one',
          fields: { value: 2 },
        })
      return reactive
        ? { subscriptionId: 'app', stop: appStop }
        : { subscriptionId: 'owned', stop }
    }),
  }
  const handle = startPublication({
    connection,
    operation: { kind: 'subscription', name: 'items', parameters: [] },
    codec: { decode: value => value, encode: value => value as null },
    mode,
    waitMs,
    ...(mode === 'isolated' ? { baseline: {} } : {}),
    disposeConnection,
    nonreactive: action => {
      nonreactive(() => {})
      reactive = false
      try {
        return action()
      } finally {
        reactive = true
      }
    },
    emit: signal => signals.push(signal),
  })
  return {
    handle,
    receive,
    signals,
    stop,
    appStop,
    callbacks,
    nonreactive,
    disposeConnection,
    stream,
  }
}
afterEach(() => vi.useRealTimers())
describe('publication observation', () => {
  it('marks only the synchronously owned publication dispatch', () => {
    const fixture = setup()
    expect(
      getFrameProvenance(
        fixture.stream,
        JSON.stringify({ msg: 'sub', id: 'owned' }),
      ),
    ).toBe('playground')
    fixture.stream.send(
      JSON.stringify({
        msg: 'sub',
        name: 'items',
        id: 'application',
        params: [],
      }),
    )
    expect(
      getFrameProvenance(
        fixture.stream,
        JSON.stringify({ msg: 'sub', id: 'application' }),
      ),
    ).toBe('application')
    fixture.handle.stop()
  })
  it('processes synchronous readiness after dispatch without arming readiness timeout', () => {
    vi.useFakeTimers()
    const fixture = setup('shared', true)
    expect(fixture.signals.slice(0, 2).map(signal => signal.kind)).toEqual([
      'dispatch',
      'ready',
    ])
    vi.advanceTimersByTime(10_000)
    expect(fixture.stop).not.toHaveBeenCalled()
    fixture.handle.stop()
  })
  it('accepts a remaining timeout below the user configuration minimum', () => {
    vi.useFakeTimers()
    const fixture = setup('isolated', false, 20)
    vi.advanceTimersByTime(20)
    expect(fixture.signals).toContainEqual(
      expect.objectContaining({ kind: 'stopped', reason: 'timeout' }),
    )
  })
  it('owns a nonreactive subscription, correlates readiness and stops idempotently', () => {
    const fixture = setup()
    fixture.receive({ msg: 'ready', subs: ['app'] })
    expect(fixture.signals.some(signal => signal.kind === 'ready')).toBe(false)
    fixture.receive({ msg: 'ready', subs: ['owned'] })
    expect(fixture.signals.some(signal => signal.kind === 'ready')).toBe(true)
    expect(fixture.nonreactive).toHaveBeenCalledOnce()
    fixture.handle.stop()
    fixture.handle.stop()
    expect(fixture.stop).toHaveBeenCalledOnce()
    expect(fixture.appStop).not.toHaveBeenCalled()
    expect(fixture.callbacks.message).toHaveLength(0)
  })
  it('stops never-ready probes and ignores late readiness', () => {
    vi.useFakeTimers()
    const fixture = setup()
    vi.advanceTimersByTime(10_000)
    fixture.receive({ msg: 'ready', subs: ['owned'] })
    expect(fixture.stop).toHaveBeenCalledOnce()
    expect(fixture.signals.some(signal => signal.kind === 'ready')).toBe(false)
    expect(fixture.signals).toContainEqual(
      expect.objectContaining({ kind: 'stopped', reason: 'timeout' }),
    )
  })
  it('captures server errors and disposes an isolated connection exactly once', () => {
    const fixture = setup('isolated')
    fixture.receive({
      msg: 'nosub',
      id: 'owned',
      error: { error: 403, reason: 'Denied' },
    })
    expect(fixture.handle.snapshot().data.error).toEqual({
      error: 403,
      reason: 'Denied',
    })
    expect(fixture.handle.snapshot().outcome).toBe('error')
    fixture.handle.stopObserving()
    expect(fixture.disposeConnection).toHaveBeenCalledOnce()
  })
  it('counts the live budget from dispatch and includes ambient baseline caveat', () => {
    vi.useFakeTimers()
    const fixture = setup('isolated')
    expect(fixture.signals[0]).toEqual(
      expect.objectContaining({
        kind: 'dispatch',
        caveat: expect.stringContaining('Ambient'),
      }),
    )
    vi.advanceTimersByTime(9000)
    fixture.receive({ msg: 'ready', subs: ['owned'] })
    vi.advanceTimersByTime(51_000)
    expect(fixture.signals).toContainEqual(
      expect.objectContaining({ kind: 'stopped', reason: 'budget' }),
    )
    expect(fixture.disposeConnection).toHaveBeenCalledOnce()
  })
  it('stops truncated probes without another subscription attempt', () => {
    const fixture = setup()
    for (let index = 0; index < 1001; index++) fixture.receive({ msg: 'ping' })
    expect(fixture.handle.snapshot().truncated).toBe(true)
    expect(fixture.stop).toHaveBeenCalledOnce()
    expect(fixture.signals).toContainEqual(
      expect.objectContaining({ kind: 'stopped', reason: 'capture-limit' }),
    )
  })
  it('retains immutable readiness evidence while live documents change', () => {
    const fixture = setup()
    fixture.receive({
      msg: 'added',
      collection: 'items',
      id: '1',
      fields: { value: 1 },
    })
    fixture.receive({ msg: 'ready', subs: ['owned'] })
    fixture.receive({
      msg: 'changed',
      collection: 'items',
      id: '1',
      fields: { value: 2 },
    })
    const ready = fixture.signals.find(signal => signal.kind === 'ready')
    expect(
      ready && 'evidence' in ready && ready.evidence.data.documents,
    ).toEqual({ items: { '1': { value: 1 } } })
    expect(fixture.handle.snapshot().data.documents).toEqual({
      items: { '1': { value: 2 } },
    })
    fixture.handle.stop()
  })
})

it('never stops an application handle returned by an unsupported shared subscribe', () => {
  const stop = vi.fn(),
    signals: PublicationSignal[] = []
  const callbacks: Record<string, StreamCallback[] | undefined> = {}
  const stream = {
    eventCallbacks: callbacks,
    on: (event: string, callback: StreamCallback) => {
      ;(callbacks[event] ??= []).push(callback)
    },
    send: vi.fn(),
  }
  const handle = startPublication({
    connection: {
      _stream: stream,
      status: () => ({ connected: true }),
      subscribe: () => ({ subscriptionId: 'application', stop }),
    },
    operation: { kind: 'subscription', name: 'items', parameters: [] },
    codec: { decode: value => value, encode: () => null },
    mode: 'shared',
    nonreactive: action => action(),
    emit: signal => signals.push(signal),
  })
  expect(signals.some(signal => signal.kind === 'local-error')).toBe(true)
  handle.stop()
  expect(stop).not.toHaveBeenCalled()
  expect(callbacks.message).toEqual([])
})

it('retains readiness boundary when synchronous changes follow ready before subscribe returns', () => {
  const fixture = setup('isolated', true, 10_000, true)
  const ready = fixture.signals.find(signal => signal.kind === 'ready')
  expect(ready?.kind === 'ready' && ready.evidence.data.documents).toEqual({
    items: { one: { value: 1 } },
  })
  expect(fixture.handle.snapshot().data.documents).toEqual({
    items: { one: { value: 2 } },
  })
  fixture.handle.stop()
})

it('publishes incomplete evidence immediately after an unsupported document-affecting frame', () => {
  const fixture = setup('isolated')
  fixture.receive({ msg: 'ready', subs: ['owned'] })
  fixture.receive({ msg: 'unknown-document-extension' })
  const last = fixture.signals.at(-1)
  expect(last?.kind).toBe('evidence')
  expect(last?.kind === 'evidence' && last.evidence.documentBaseline).toBe(
    'unknown',
  )
  expect(last?.kind === 'evidence' ? last.reasons.length : 0).toBeGreaterThan(0)
  fixture.handle.stop()
})
it.each([false, true])(
  'owns a fresh native subscription queued behind async stubs (stop before send: %s)',
  stopBeforeSend => {
    const signals: PublicationSignal[] = [],
      appStop = vi.fn(),
      ownStop = vi.fn(),
      queued: (() => void)[] = []
    const callbacks: Record<string, StreamCallback[] | undefined> = {}
    const stream = {
      eventCallbacks: callbacks,
      on: (event: string, callback: StreamCallback) => {
        ;(callbacks[event] ??= []).push(callback)
      },
      send: vi.fn(),
    }
    const subscriptions: Record<string, unknown> = {
      application: { id: 'application', name: 'items', inactive: false },
    }
    const connection = {
      _stream: stream,
      _subscriptions: subscriptions,
      status: () => ({ connected: true }),
      subscribe: () => {
        subscriptions.owned = {
          id: 'owned',
          name: 'items',
          inactive: false,
          connection,
          remove() {
            delete subscriptions.owned
          },
          stop: ownStop,
        }
        queued.push(() =>
          stream.send(
            JSON.stringify({ msg: 'sub', name: 'items', id: 'owned' }),
          ),
        )
        return {
          subscriptionId: 'owned',
          stop: () => {
            ownStop()
            delete subscriptions.owned
            queued.push(() =>
              stream.send(JSON.stringify({ msg: 'unsub', id: 'owned' })),
            )
          },
        }
      },
    }
    const handle = startPublication({
      connection,
      operation: { kind: 'subscription', name: 'items', parameters: [] },
      codec: { decode: value => value, encode: () => null },
      mode: 'shared',
      nonreactive: action => action(),
      emit: signal => signals.push(signal),
    })
    expect(signals.some(signal => signal.kind === 'local-error')).toBe(false)
    if (stopBeforeSend) handle.stop()
    for (const send of queued) send()
    expect(
      getFrameProvenance(stream, JSON.stringify({ msg: 'sub', id: 'owned' })),
    ).toBe('playground')
    if (!stopBeforeSend) {
      for (const callback of callbacks.message ?? [])
        callback(JSON.stringify({ msg: 'ready', subs: ['owned'] }))
      expect(signals.some(signal => signal.kind === 'ready')).toBe(true)
      handle.stop()
    }
    expect(ownStop).toHaveBeenCalledOnce()
    expect(appStop).not.toHaveBeenCalled()
    expect(subscriptions).toHaveProperty('application')
    expect(subscriptions).not.toHaveProperty('owned')
  },
)
it('keeps effective publication arguments immutable when a custom decoder mutates its input', () => {
  const callbacks: Record<string, StreamCallback[] | undefined> = {},
    request = {
      kind: 'subscription' as const,
      name: 'items',
      parameters: [{ x: 1 }],
    }
  const stream = {
    eventCallbacks: callbacks,
    on: (event: string, callback: StreamCallback) => {
      ;(callbacks[event] ??= []).push(callback)
    },
    send: vi.fn(),
  }
  const subscribe = vi.fn(() => {
    stream.send(JSON.stringify({ msg: 'sub', name: 'items', id: 'owned' }))
    return { subscriptionId: 'owned', stop: () => {} }
  })
  const handle = startPublication({
    connection: {
      _stream: stream,
      status: () => ({ connected: true }),
      subscribe,
    },
    operation: request,
    mode: 'shared',
    nonreactive: action => action(),
    codec: {
      decode: value => {
        if (
          value !== null &&
          typeof value === 'object' &&
          !Array.isArray(value)
        )
          value.x = 99
        return value
      },
      encode: () => null,
    },
    emit: () => {},
  })
  expect(request.parameters).toEqual([{ x: 1 }])
  expect(subscribe).toHaveBeenCalledWith('items', { x: 99 })
  handle.stop()
})

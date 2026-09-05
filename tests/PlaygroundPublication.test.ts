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
      if (synchronousReady) receive({ msg: 'ready', subs: ['owned'] })
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

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PlaygroundRunner,
  type ExecutionTarget,
  type RunnerEvent,
} from '../src/Injectors/Playground/Runner'
import type { InvocationOptions } from '../src/Injectors/Playground/MethodAdapter'
import type { StreamCallback } from '../src/Injectors/Playground/StreamObserver'
import type { RunCommand } from '../src/Playground/Commands'

const identity = {
  version: 1 as const,
  panelSessionId: 'panel',
  pageEpoch: 'page',
}
const command = (id = 'run', isolated = false): RunCommand => ({
  ...identity,
  kind: 'run',
  requestId: id,
  connectionId: 'connection',
  operation: { kind: 'method', name: 'echo', parameters: [] },
  sessionLabel: 'A',
  waitMs: 1000,
  ...(isolated
    ? { mode: 'isolated' as const, authentication: 'anonymous' as const }
    : { mode: 'application' as const, authentication: 'current' as const }),
})
const setup = () => {
  const events: RunnerEvent[] = []
  const callbacks: Record<string, StreamCallback[]> = {
    message: [],
    disconnect: [],
  }
  const stream = {
    eventCallbacks: callbacks,
    on(event: string, callback: StreamCallback) {
      callbacks[event]!.push(callback)
    },
    send: vi.fn(),
  }
  const invokers: Record<
    string,
    {
      _onResultReceived: InvocationOptions['onResultReceived']
      noRetry: boolean
    }
  > = {}
  let next = 0
  const stop = vi.fn()
  const target: ExecutionTarget = {
    endpointLabel: 'localhost',
    authentication: {
      state: 'anonymous',
      observedAt: 0,
      provenance: 'runtime',
    },
    connection: {
      _stream: stream,
      _methodInvokers: invokers,
      status: () => ({ connected: true }),
      apply: vi.fn((name, args, options) => {
        const id = String(++next)
        invokers[id] = {
          _onResultReceived: options.onResultReceived,
          noRetry: options.noRetry,
        }
        stream.send(
          JSON.stringify({ msg: 'method', id, method: name, params: args }),
        )
      }),
      subscribe: vi.fn(() => {
        stream.send(
          JSON.stringify({
            msg: 'sub',
            name: 'items',
            id: 'owned',
            params: [],
          }),
        )
        return { subscriptionId: 'owned', stop }
      }),
    },
  }
  Object.assign(target.connection, {
    _apply(
      this: { _methodInvokers: typeof invokers },
      _name: string,
      _stub: unknown,
      _args: unknown,
      options: InvocationOptions,
    ) {
      // eslint-disable-next-line unicorn/no-this-outside-of-class -- Native capability probe supplies an inert receiver.
      this._methodInvokers['1'] = {
        _onResultReceived: options.onResultReceived,
        noRetry: options.noRetry,
      }
    },
  })
  const openIsolated = vi.fn(async () => target)
  const runner = new PlaygroundRunner({
    pageEpoch: 'page',
    resolveTarget: () => target,
    openIsolated,
    codec: { decode: value => value, encode: () => null },
    nonreactive: action => action(),
    emit: event => events.push(event),
  })
  runner.handle({ ...identity, kind: 'open' })
  const receive = (frame: unknown) => {
    for (const callback of callbacks.message!) callback(JSON.stringify(frame))
  }
  return { runner, events, target, receive, callbacks, openIsolated, stop }
}
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})
describe('playground runner', () => {
  it('never echoes credential parameters from rejected malformed commands', () => {
    const fixture = setup()
    const secret = Array.from({ length: 20 }, (_, index) => String(index)).join(
      '-',
    )
    fixture.runner.handle({
      ...command(),
      waitMs: 0,
      operation: {
        kind: 'method',
        name: 'login',
        parameters: [{ resume: secret }],
      },
    })
    expect(fixture.target.connection.apply).not.toHaveBeenCalled()
    expect(JSON.stringify(fixture.events)).not.toContain(secret)
    expect(fixture.events.at(-1)?.kind).toBe('error')
    fixture.runner.dispose()
  })
  it('dispatches once, correlates result and updated, and publishes immutable records', () => {
    const fixture = setup()
    fixture.runner.handle(command())
    fixture.runner.handle(command())
    expect(fixture.target.connection.apply).toHaveBeenCalledOnce()
    fixture.receive({ msg: 'result', id: '1', result: { value: 1 } })
    const result = fixture.events.findLast(event => event.kind === 'run')
    expect(result?.kind === 'run' && result.record.finished).toBe(false)
    fixture.receive({ msg: 'updated', methods: ['1'] })
    const final = fixture.events.findLast(event => event.kind === 'run')
    expect(final?.kind === 'run' && final.record.finished).toBe(true)
    expect(result?.kind === 'run' && result.record.finished).toBe(false)
    fixture.runner.dispose()
  })
  it('rejects stale page and caps active operations without dispatch', () => {
    const fixture = setup()
    fixture.runner.handle({ ...command(), pageEpoch: 'old' })
    for (let index = 0; index < 4; index++)
      fixture.runner.handle(command(String(index)))
    expect(fixture.target.connection.apply).toHaveBeenCalledTimes(3)
    fixture.runner.dispose()
  })
  it('times out waiting but records late application results without reopening', () => {
    vi.useFakeTimers()
    const fixture = setup()
    fixture.runner.handle(command())
    vi.advanceTimersByTime(1000)
    fixture.receive({ msg: 'result', id: '1', result: 2 })
    const final = fixture.events.findLast(event => event.kind === 'run')
    expect(final?.kind === 'run' && final.record.method?.lateEvidence).toBe(
      true,
    )
    expect(final?.kind === 'run' && final.record.finished).toBe(true)
    fixture.runner.dispose()
    expect(fixture.callbacks.message).toHaveLength(0)
  })
  it('aborts setup, disposes a late isolated target, and never invokes it', async () => {
    vi.useFakeTimers()
    const fixture = setup()
    let resolve: ((target: ExecutionTarget) => void) | undefined
    fixture.openIsolated.mockImplementation(
      () =>
        new Promise<ExecutionTarget>(done => {
          resolve = done
        }),
    )
    const dispose = vi.fn()
    fixture.runner.handle(command('isolated', true))
    vi.advanceTimersByTime(1000)
    resolve?.({ ...fixture.target, dispose })
    await Promise.resolve()
    await Promise.resolve()
    expect(dispose).toHaveBeenCalledOnce()
    expect(fixture.target.connection.apply).not.toHaveBeenCalled()
    fixture.runner.dispose()
  })
  it('retains readiness evidence after stopping a live publication', () => {
    const fixture = setup()
    fixture.runner.handle({
      ...command(),
      operation: { kind: 'subscription', name: 'items', parameters: [] },
    })
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
    fixture.runner.handle({ ...identity, kind: 'stop', requestId: 'run' })
    const final = fixture.events.findLast(event => event.kind === 'run')
    expect(
      final?.kind === 'run' && final.record.readiness?.data.documents,
    ).toEqual({ items: { '1': { value: 1 } } })
    expect(
      final?.kind === 'run' && final.record.evidence.data.documents,
    ).toEqual({ items: { '1': { value: 2 } } })
    fixture.runner.dispose()
  })
  it('truncates oversized method evidence before emitting and releases observers', () => {
    const fixture = setup()
    fixture.runner.handle(command())
    fixture.receive({
      msg: 'result',
      id: '1',
      result: 'x'.repeat(2 * 1024 * 1024),
    })
    const final = fixture.events.findLast(event => event.kind === 'run')
    expect(final?.kind === 'run' && final.record.phase).toBe('limit-exceeded')
    expect(final?.kind === 'run' && final.record.evidence.truncated).toBe(true)
    expect(
      fixture.events.every(
        event => JSON.stringify(event).length < 2 * 1024 * 1024,
      ),
    ).toBe(true)
    expect(fixture.callbacks.message).toHaveLength(0)
    fixture.runner.dispose()
  })
  it('stops a source that becomes stale and does not retry', () => {
    vi.useFakeTimers()
    const fixture = setup()
    fixture.runner.handle({ ...command(), waitMs: 60_000 })
    fixture.target.sourceCurrent = () => false
    vi.advanceTimersByTime(5000)
    expect(fixture.target.connection.apply).toHaveBeenCalledOnce()
    const final = fixture.events.findLast(event => event.kind === 'run')
    expect(final?.kind === 'run' && final.record.phase).toBe('interrupted')
    fixture.runner.dispose()
  })
  it('expires a panel lease and stops only owned subscriptions', () => {
    vi.useFakeTimers()
    const fixture = setup()
    fixture.runner.handle({
      ...command(),
      operation: { kind: 'subscription', name: 'items', parameters: [] },
      waitMs: 60_000,
    })
    vi.advanceTimersByTime(30_000)
    expect(fixture.stop).toHaveBeenCalledOnce()
    fixture.runner.dispose()
  })
})
it('treats thrown source status as interruption and still expires owned leases', () => {
  vi.useFakeTimers()
  const fixture = setup()
  fixture.runner.handle({
    ...command(),
    operation: { kind: 'subscription', name: 'items', parameters: [] },
    waitMs: 60_000,
  })
  fixture.target.sourceCurrent = () => {
    throw new Error('private-source-detail')
  }
  expect(() => vi.advanceTimersByTime(5000)).not.toThrow()
  expect(fixture.stop).toHaveBeenCalledOnce()
  expect(JSON.stringify(fixture.events)).not.toContain('private-source-detail')
  const final = fixture.events.findLast(event => event.kind === 'run')
  expect(final?.kind === 'run' && final.record.phase).toBe('interrupted')
  fixture.runner.dispose()
})
it('publishes a failed run if opening an isolated target throws synchronously', () => {
  const fixture = setup()
  fixture.openIsolated.mockImplementation(() => {
    throw new Error('private-setup-detail')
  })
  fixture.runner.handle(command('isolated', true))
  const final = fixture.events.findLast(event => event.kind === 'run')
  expect(final?.kind === 'run' && final.record.finished).toBe(true)
  expect(final?.kind === 'run' && final.record.phase).toBe('local-error')
  expect(JSON.stringify(fixture.events)).not.toContain('private-setup-detail')
  fixture.runner.dispose()
})

import { PublicationDocuments } from '../src/Playground/Documents'
it.each([false, true])(
  'retains completed publication evidence without keeping a live snapshot handle (synchronous: %s)',
  synchronous => {
    const fixture = setup()
    if (synchronous)
      fixture.target.connection.subscribe = vi.fn(() => {
        fixture.target.connection._stream.send(
          JSON.stringify({
            msg: 'sub',
            name: 'items',
            id: 'owned',
            params: [],
          }),
        )
        fixture.receive({ msg: 'nosub', id: 'owned' })
        return { subscriptionId: 'owned', stop: fixture.stop }
      })
    fixture.runner.handle({
      ...command(),
      operation: { kind: 'subscription', name: 'items', parameters: [] },
    })
    if (!synchronous) {
      fixture.receive({ msg: 'ready', subs: ['owned'] })
      fixture.runner.handle({ ...identity, kind: 'stop', requestId: 'run' })
    }
    const snapshot = vi.spyOn(PublicationDocuments.prototype, 'snapshot')
    fixture.runner.handle({ ...identity, kind: 'snapshot', requestId: 'run' })
    expect(snapshot).not.toHaveBeenCalled()
    expect(fixture.callbacks.message).toEqual([])
    expect(fixture.callbacks.disconnect).toEqual([])
    expect(fixture.stop).toHaveBeenCalledOnce()
    snapshot.mockRestore()
    fixture.runner.dispose()
  },
)

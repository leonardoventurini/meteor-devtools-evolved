/* eslint-disable unicorn/no-this-outside-of-class -- Receiver preservation is a transport contract. */
import { describe, expect, it, vi } from 'vitest'
import { getFrameProvenance } from '../src/Injectors/Playground/CaptureProvenance'
import { invokeMethod } from '../src/Injectors/Playground/MethodAdapter'
import type { MethodSignal } from '../src/Playground/MethodRun'
import type { EncodedValue } from '../src/Playground/Values'

const operation = {
  kind: 'method' as const,
  name: 'fixture.echo',
  parameters: [{ x: 1 }],
}
const codec = {
  decode: (value: EncodedValue): unknown => value,
  encode: (value: unknown): EncodedValue => value as EncodedValue,
}
type Callback = (error?: unknown, result?: unknown) => void

const fixture = () => {
  const sent: string[] = []
  const queue: Array<() => void> = []
  const eventCallbacks: Record<string, Array<(...args: unknown[]) => void>> = {
    message: [],
    disconnect: [],
  }
  const invokers: Record<
    string,
    { methodId: string; _onResultReceived: Callback; noRetry: boolean }
  > = {}
  let id = 0
  const stream = {
    eventCallbacks,
    on: (event: string, callback: (...args: unknown[]) => void) => {
      ;(eventCallbacks[event] ??= []).push(callback)
    },
    send: vi.fn(function (this: unknown, raw: string) {
      expect(this).toBe(stream)
      sent.push(raw)
      return 'sent'
    }),
  }
  const connection = {
    _stream: stream,
    _methodInvokers: invokers,
    status: () => ({ connected: true }),
    apply: vi.fn(
      (
        name: string,
        args: unknown[],
        options: { noRetry: boolean; onResultReceived: Callback },
      ) => {
        const methodId = String(++id)
        invokers[methodId] = {
          methodId,
          _onResultReceived: options.onResultReceived,
          noRetry: options.noRetry,
        }
        stream.send(
          JSON.stringify({
            msg: 'method',
            id: methodId,
            method: name,
            params: args,
          }),
        )
      },
    ),
  }
  const asyncConnection = {
    ...connection,
    applyAsync: vi.fn(
      (...args: Parameters<typeof connection.apply>) =>
        new Promise<void>(resolve => {
          queue.push(() => {
            connection.apply(...args)
            resolve()
          })
        }),
    ),
  }
  const inbound = (frame: unknown) => {
    // eslint-disable-next-line unicorn/no-useless-spread -- Match native frame iteration when callbacks remove themselves.
    for (const callback of [...(eventCallbacks.message ?? [])])
      callback(JSON.stringify(frame))
  }
  return {
    connection,
    asyncConnection,
    stream,
    sent,
    queue,
    invokers,
    inbound,
    eventCallbacks,
  }
}

describe('connection-specific method adapter', () => {
  it('marks the exact native method ID before ordinary capture', () => {
    const runtime = fixture()
    const captured: string[] = []
    runtime.stream.send.mockImplementation(function (raw) {
      captured.push(getFrameProvenance(runtime.stream, raw))
      return 'sent'
    })
    const handle = invokeMethod({
      connection: runtime.connection,
      operation,
      codec,
      emit: () => {},
    })
    expect(captured).toEqual(['playground'])
    runtime.stream.send(
      JSON.stringify({
        msg: 'method',
        id: 'application',
        method: operation.name,
      }),
    )
    expect(captured).toEqual(['playground', 'application'])
    handle.stopObserving()
  })
  it('correlates identical concurrent calls by exact invoker callback identity', () => {
    const runtime = fixture()
    const first: MethodSignal[] = []
    const second: MethodSignal[] = []
    const a = invokeMethod({
      connection: runtime.connection,
      operation,
      codec,
      emit: signal => first.push(signal),
      now: () => 12,
    })
    const b = invokeMethod({
      connection: runtime.connection,
      operation,
      codec,
      emit: signal => second.push(signal),
      now: () => 13,
    })
    runtime.inbound({ msg: 'updated', methods: ['2'] })
    runtime.inbound({ msg: 'result', id: '1', result: { a: 1 } })
    runtime.inbound({ msg: 'result', id: '2', error: { error: 'denied' } })
    runtime.inbound({ msg: 'updated', methods: ['1'] })
    expect(first.map(signal => signal.kind)).toEqual([
      'invoke',
      'dispatch',
      'result',
      'updated',
    ])
    expect(second.map(signal => signal.kind)).toEqual([
      'invoke',
      'dispatch',
      'updated',
      'result',
    ])
    expect(first[1]).toEqual({ kind: 'dispatch', at: 12, methodId: '1' })
    expect(second[1]).toEqual({ kind: 'dispatch', at: 13, methodId: '2' })
    expect(runtime.invokers['1']?.noRetry).toBe(true)
    a.stopObserving()
    b.stopObserving()
    expect(runtime.eventCallbacks.message).toHaveLength(0)
    expect(runtime.eventCallbacks.disconnect).toHaveLength(0)
  })

  it('does not mistake the async dispatch promise for a server result', async () => {
    const runtime = fixture()
    const emit = vi.fn()
    const handle = invokeMethod({
      connection: runtime.asyncConnection,
      operation,
      codec,
      emit,
    })
    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'invoke' }),
    )
    runtime.queue.shift()?.()
    await Promise.resolve()
    expect(emit.mock.calls.map(([signal]) => signal.kind)).toEqual([
      'invoke',
      'dispatch',
    ])
    handle.stopObserving()
  })

  it('rejects disconnected or unsupported connections without a default fallback', () => {
    const runtime = fixture()
    const emit = vi.fn()
    invokeMethod({
      connection: {
        ...runtime.connection,
        status: () => ({ connected: false }),
      },
      operation,
      codec,
      emit,
    })
    expect(runtime.connection.apply).not.toHaveBeenCalled()
    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'local-error' }),
    )
  })

  it('interrupts on synthetic invocation-failed without waiting for the final callback', async () => {
    const runtime = fixture()
    const emit = vi.fn()
    const handle = invokeMethod({
      connection: runtime.connection,
      operation,
      codec,
      emit,
    })
    runtime.invokers['1']?._onResultReceived({ error: 'invocation-failed' })
    await Promise.resolve()
    expect(emit.mock.calls.map(([signal]) => signal.kind)).toEqual([
      'invoke',
      'dispatch',
      'disconnect',
    ])
    handle.stopObserving()
  })

  it('does not emit app traffic or duplicate wire evidence', () => {
    const runtime = fixture()
    const emit = vi.fn()
    const handle = invokeMethod({
      connection: runtime.connection,
      operation,
      codec,
      emit,
    })
    runtime.inbound({ msg: 'result', id: 'unknown', result: 'secret' })
    runtime.inbound({ msg: 'result', id: '1', result: 1 })
    runtime.inbound({ msg: 'result', id: '1', result: 2 })
    expect(emit.mock.calls.map(([signal]) => signal.kind)).toEqual([
      'invoke',
      'dispatch',
      'result',
    ])
    handle.stopObserving()
  })

  it('preserves transport return values and app wrappers during cleanup', () => {
    const runtime = fixture()
    const original = runtime.stream.send
    const handle = invokeMethod({
      connection: runtime.connection,
      operation,
      codec,
      emit: vi.fn(),
    })
    const instrumented = runtime.stream.send
    const wrapper = vi.fn(function (this: unknown, raw: string) {
      return instrumented.call(this, raw)
    })
    runtime.stream.send = wrapper
    handle.stopObserving()
    expect(runtime.stream.send).toBe(wrapper)
    expect(runtime.stream.send('{"msg":"ping"}')).toBe('sent')
    expect(original).toHaveBeenCalledTimes(2)
  })
  it('reports late wire dispatch after local stop without pretending to cancel Meteor work', async () => {
    const runtime = fixture()
    const signals: MethodSignal[] = []
    const handle = invokeMethod({
      connection: runtime.asyncConnection,
      operation,
      codec,
      emit: signal => signals.push(signal),
    })
    handle.stop()
    handle.stop()
    runtime.queue.shift()?.()
    await Promise.resolve()
    runtime.inbound({ msg: 'result', id: '1', result: true })
    expect(signals.map(signal => signal.kind)).toEqual([
      'invoke',
      'stop',
      'dispatch',
      'result',
    ])
    expect(runtime.sent).toHaveLength(1)
    handle.stopObserving()
    runtime.inbound({ msg: 'updated', methods: ['1'] })
    expect(signals).toHaveLength(4)
  })

  it('removes only its own listeners and catches no application send errors', () => {
    const runtime = fixture()
    const appListener = vi.fn()
    runtime.eventCallbacks.message?.push(appListener)
    const original = runtime.stream.send
    const handle = invokeMethod({
      connection: runtime.connection,
      operation,
      codec,
      emit: vi.fn(),
    })
    original.mockImplementationOnce(() => {
      throw new Error('application transport failed')
    })
    expect(() => runtime.stream.send('{"msg":"ping"}')).toThrow(
      'application transport failed',
    )
    handle.stopObserving()
    expect(runtime.eventCallbacks.message).toEqual([appListener])
    expect(runtime.stream.send).toBe(original)
  })

  it('does not duplicate observations when an application rewraps between runs', () => {
    const runtime = fixture()
    const first = invokeMethod({
      connection: runtime.connection,
      operation,
      codec,
      emit: vi.fn(),
    })
    const captured = runtime.stream.send
    runtime.stream.send = vi.fn(function (this: unknown, raw: string) {
      return captured.call(this, raw)
    })
    first.stopObserving()
    const emit = vi.fn()
    const second = invokeMethod({
      connection: runtime.connection,
      operation,
      codec,
      emit,
    })
    expect(emit.mock.calls.map(([signal]) => signal.kind)).toEqual([
      'invoke',
      'dispatch',
    ])
    expect(runtime.sent).toHaveLength(2)
    expect(runtime.eventCallbacks.message).toHaveLength(1)
    second.stopObserving()
    expect(runtime.eventCallbacks.message).toHaveLength(0)
  })
  it('fails closed when stream callbacks cannot be removed by exact identity', () => {
    const runtime = fixture()
    runtime.stream.on = () => {}
    const emit = vi.fn()
    invokeMethod({
      connection: runtime.connection,
      operation,
      codec,
      emit,
    })
    expect(runtime.connection.apply).not.toHaveBeenCalled()
    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'local-error',
        message: expect.stringContaining('listener capability'),
      }),
    )
  })

  it('releases all listeners after repeated invocation and observation disposal', () => {
    const runtime = fixture()
    const original = runtime.stream.send
    for (let index = 0; index < 30; index++) {
      const handle = invokeMethod({
        connection: runtime.connection,
        operation,
        codec,
        emit: vi.fn(),
      })
      handle.stopObserving()
      handle.stopObserving()
    }
    expect(runtime.eventCallbacks.message).toHaveLength(0)
    expect(runtime.eventCallbacks.disconnect).toHaveLength(0)
    expect(runtime.stream.send).toBe(original)
  })
  it('cleanup during a native message iteration does not skip a later application listener', () => {
    const runtime = fixture()
    let cleanup: (() => void) | undefined
    const handle = invokeMethod({
      connection: runtime.connection,
      operation,
      codec,
      emit: signal => {
        if (signal.kind === 'updated') cleanup?.()
      },
    })
    cleanup = handle.stopObserving
    const appListener = vi.fn()
    runtime.eventCallbacks.message?.push(appListener)
    // eslint-disable-next-line unicorn/no-array-for-each -- Reproduce Meteor's actual callback iteration to detect skipped foreign handlers.
    runtime.eventCallbacks.message?.forEach(callback =>
      callback('{"msg":"updated","methods":["1"]}'),
    )
    expect(appListener).toHaveBeenCalledOnce()
    expect(runtime.eventCallbacks.message).toEqual([appListener])
  })
  it('preserves actual server invocation-failed errors as wire evidence', async () => {
    const runtime = fixture()
    const emit = vi.fn()
    const handle = invokeMethod({
      connection: runtime.connection,
      operation,
      codec,
      emit,
    })
    runtime.invokers['1']?._onResultReceived({ error: 'invocation-failed' })
    runtime.inbound({
      msg: 'result',
      id: '1',
      error: { error: 'invocation-failed', reason: 'server-defined error' },
    })
    await Promise.resolve()
    expect(emit.mock.calls.map(([signal]) => signal.kind)).toEqual([
      'invoke',
      'dispatch',
      'result',
    ])
    handle.stopObserving()
  })

  it('retains encoded server values without invoking custom type decoders', () => {
    const runtime = fixture()
    const emit = vi.fn()
    const decode = vi.fn(codec.decode)
    const encode = vi.fn(codec.encode)
    const handle = invokeMethod({
      connection: runtime.connection,
      operation,
      codec: { decode, encode },
      emit,
    })
    const result = {
      $type: 'application-custom-value',
      $value: { preserved: true },
    }
    runtime.inbound({ msg: 'result', id: '1', result })
    expect(decode).toHaveBeenCalledTimes(operation.parameters.length)
    expect(encode).not.toHaveBeenCalled()
    expect(emit).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: 'result', result }),
    )
    handle.stopObserving()
  })
})
it('does not let custom decoders mutate the retained effective request', () => {
  const state = fixture(),
    request = structuredClone(operation)
  const handle = invokeMethod({
    connection: state.connection,
    operation: request,
    codec: {
      ...codec,
      decode: value => {
        if (
          value !== null &&
          typeof value === 'object' &&
          !Array.isArray(value)
        )
          value.x = 99
        return value
      },
    },
    emit: () => {},
  })
  expect(request.parameters).toEqual([{ x: 1 }])
  expect(state.connection.apply).toHaveBeenCalledWith(
    'fixture.echo',
    [{ x: 99 }],
    expect.any(Object),
    expect.any(Function),
  )
  handle.stopObserving()
})

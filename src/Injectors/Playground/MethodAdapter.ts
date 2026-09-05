import type { Operation } from '../../Playground/Commands'
import type { MethodSignal } from '../../Playground/MethodRun'
import { validateValue, type EncodedValue } from '../../Playground/Values'
import { markPlaygroundFrame } from './CaptureProvenance'
import { observeStream, type ObservableStream } from './StreamObserver'

type Callback = (error?: unknown, result?: unknown) => void
export interface InvocationOptions {
  noRetry: true
  onResultReceived: Callback
}
export interface MethodConnection {
  _stream: ObservableStream
  _methodInvokers: Record<
    string,
    { _onResultReceived: Callback; noRetry: boolean } | undefined
  >
  status(): { connected: boolean }
  apply(
    name: string,
    args: unknown[],
    options: InvocationOptions,
    callback: Callback,
  ): unknown
  applyAsync?(
    name: string,
    args: unknown[],
    options: InvocationOptions,
    callback: Callback,
  ): Promise<unknown>
}
export interface MethodCodec {
  decode(value: EncodedValue): unknown
  encode(value: unknown): EncodedValue
}
export interface MethodHandle {
  stop(): void
  stopObserving(): void
}
interface Request {
  connection: MethodConnection
  operation: Operation
  codec: MethodCodec
  emit(signal: MethodSignal): void
  now?: () => number
}
const noop = () => {}

const frameObject = (raw: string): Record<string, unknown> | undefined => {
  try {
    const value: unknown = JSON.parse(raw)
    if (value !== null && typeof value === 'object' && !Array.isArray(value))
      return value as Record<string, unknown>
  } catch {
    /* Unrelated malformed transport traffic is not this invocation's evidence. */
  }
  return undefined
}

/**
 * Invokes only the supplied live connection. Correlation uses the exact callback
 * stored on Meteor's allocated invoker, never predicted IDs, names or arguments.
 * Internal authentication must use its separate credential-safe path, not this
 * user-evidence adapter. Neither stop operation cancels Meteor or server effects.
 *
 * stop ends local waiting while retaining late evidence; the owning lease/run
 * budget must eventually call stopObserving to release all transport observers.
 */
export const invokeMethod = ({
  connection,
  operation,
  codec,
  emit,
  now = Date.now,
}: Request): MethodHandle => {
  let observing = true
  let stopped = false
  let methodId: string | undefined
  let resultSeen = false
  let updatedSeen = false
  let interrupted = false
  let release = noop
  const signal = (value: MethodSignal) => {
    if (observing) emit(value)
  }
  const localError = (message: string) =>
    signal({ kind: 'local-error', at: now(), message })
  const interrupt = () => {
    if (interrupted) return
    interrupted = true
    signal({ kind: 'disconnect', at: now() })
  }
  const handle = {
    stop: () => {
      if (!stopped && observing) {
        stopped = true
        signal({ kind: 'stop', at: now() })
      }
    },
    stopObserving: () => {
      observing = false
      release()
    },
  }
  try {
    if (operation.kind !== 'method')
      throw new TypeError('Expected a method operation.')
    if (!connection.status().connected)
      throw new Error('The selected connection is disconnected.')
    if (
      typeof connection.apply !== 'function' ||
      !connection._methodInvokers ||
      typeof connection._stream?.send !== 'function' ||
      typeof connection._stream.on !== 'function' ||
      !connection._stream.eventCallbacks
    )
      throw new Error(
        'Method correlation capability unavailable on the selected connection.',
      )
    const parameters = operation.parameters.map(value =>
      codec.decode(structuredClone(value)),
    )
    const onResultReceived: Callback = error => {
      if (
        error !== null &&
        typeof error === 'object' &&
        'error' in error &&
        error.error === 'invocation-failed'
      ) {
        // Meteor's listener runs first; an actual wire error with this code is still server evidence.
        queueMicrotask(() => {
          if (!resultSeen) interrupt()
        })
      }
    }
    const encodeWire = (value: unknown): EncodedValue => {
      validateValue(value)
      return value
    }
    release = observeStream(connection._stream, {
      outbound: raw => {
        const frame = frameObject(raw)
        if (frame?.msg !== 'method' || typeof frame.id !== 'string') return
        const invoker = connection._methodInvokers[frame.id]
        if (invoker?._onResultReceived !== onResultReceived) return
        if (methodId !== undefined) return
        methodId = frame.id
        markPlaygroundFrame(connection._stream, raw)
        signal({ kind: 'dispatch', at: now(), methodId })
        // Observation cannot veto transport traffic; altered native methods can only be diagnosed here.
        if (!invoker.noRetry) {
          localError('Meteor did not preserve the no-retry invocation option.')
          return
        }
      },
      inbound: raw => {
        if (methodId === undefined) return
        const frame = frameObject(raw)
        if (!frame) return
        try {
          if (frame.msg === 'result' && frame.id === methodId && !resultSeen) {
            resultSeen = true
            signal({
              kind: 'result',
              at: now(),
              ...(Object.hasOwn(frame, 'result')
                ? { result: encodeWire(frame.result) }
                : {}),
              ...(Object.hasOwn(frame, 'error')
                ? { error: encodeWire(frame.error) }
                : {}),
            })
          }
          if (
            frame.msg === 'updated' &&
            Array.isArray(frame.methods) &&
            frame.methods.includes(methodId) &&
            !updatedSeen
          ) {
            updatedSeen = true
            signal({ kind: 'updated', at: now() })
          }
        } catch {
          localError(
            'The server evidence could not be encoded within the supported value limits.',
          )
        }
      },
      disconnect: interrupt,
    })
    signal({ kind: 'invoke', at: now() })
    const options: InvocationOptions = { noRetry: true, onResultReceived }
    const callback: Callback = onResultReceived
    if (typeof connection.applyAsync === 'function') {
      const pending = connection.applyAsync(
        operation.name,
        parameters,
        options,
        callback,
      )
      void pending.catch(() =>
        localError('Meteor rejected the local method invocation.'),
      )
    } else connection.apply(operation.name, parameters, options, callback)
  } catch (error) {
    localError(
      error instanceof Error
        ? error.message
        : 'Method invocation capability unavailable.',
    )
    release()
  }
  return handle
}

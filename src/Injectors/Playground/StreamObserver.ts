/* eslint-disable unicorn/no-this-outside-of-class -- Meteor transport wrappers must retain the application receiver. */
export type StreamCallback = (...args: unknown[]) => void
export interface ObservableStream {
  eventCallbacks: Record<string, StreamCallback[] | undefined>
  on(event: string, callback: StreamCallback): unknown
  send(raw: string): unknown
}
export interface StreamObservation {
  outbound(raw: string): void
  inbound(raw: string): void
  disconnect(): void
}
interface Hub {
  observers: Set<StreamObservation>
  wrapper: ObservableStream['send']
  previous: ObservableStream['send']
  depth: number
  inbound: StreamCallback
  disconnect: StreamCallback
}
const noop = () => {}
const hubs = new WeakMap<ObservableStream, Hub>()
const notify = (hub: Hub, action: (observer: StreamObservation) => void) => {
  // eslint-disable-next-line unicorn/no-useless-spread -- Freeze this frame's recipients before observer callbacks can register more.
  for (const observer of [...hub.observers]) {
    try {
      action(observer)
    } catch {
      /* Inspection must never change application transport behavior. */
    }
  }
}

/**
 * Shares one pair of inbound/disconnect listeners per live stream. A wrapper
 * installed by the application after ours is never overwritten during cleanup.
 * Re-entrant wrappers share a depth guard, so an application wrapper retaining
 * an older adapter wrapper cannot produce duplicate observations.
 */
export const observeStream = (
  stream: ObservableStream,
  observer: StreamObservation,
): (() => void) => {
  let hub = hubs.get(stream)
  if (!hub) {
    const created: Hub = {
      observers: new Set(),
      previous: stream.send,
      wrapper: stream.send,
      depth: 0,
      inbound: noop,
      disconnect: noop,
    }
    created.inbound = (...args) => {
      const raw = args[0]
      if (typeof raw === 'string') notify(created, item => item.inbound(raw))
    }
    created.disconnect = () => notify(created, item => item.disconnect())
    hub = created
    hubs.set(stream, hub)
  }
  const active = hub
  const removeListeners = () => {
    for (const [event, listener] of [
      ['message', active.inbound],
      ['disconnect', active.disconnect],
    ] as const) {
      const callbacks = stream.eventCallbacks[event]
      if (callbacks?.includes(listener)) {
        // Replace the list so cleanup inside native forEach cannot skip another listener.
        stream.eventCallbacks[event] = callbacks.filter(
          callback => callback !== listener,
        )
      }
    }
  }
  if (active.observers.size === 0) {
    try {
      stream.on('message', active.inbound)
      stream.on('disconnect', active.disconnect)
      if (
        !stream.eventCallbacks.message?.includes(active.inbound) ||
        !stream.eventCallbacks.disconnect?.includes(active.disconnect)
      ) {
        throw new Error(
          'Native removable stream listener capability unavailable.',
        )
      }
    } catch (error) {
      removeListeners()
      throw error
    }
  }
  if (stream.send !== active.wrapper || active.observers.size === 0) {
    const previous = stream.send
    active.previous = previous
    active.wrapper = function (raw) {
      active.depth += 1
      try {
        if (active.depth === 1) notify(active, item => item.outbound(raw))
        return previous.call(this, raw)
      } finally {
        active.depth -= 1
      }
    }
    stream.send = active.wrapper
  }
  active.observers.add(observer)
  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    active.observers.delete(observer)
    if (active.observers.size > 0) return
    removeListeners()
    if (stream.send === active.wrapper) stream.send = active.previous
  }
}

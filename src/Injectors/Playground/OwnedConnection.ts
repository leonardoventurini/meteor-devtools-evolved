import type {
  ConnectionOwnership,
  ConnectionRegistry,
} from '../ConnectionRegistry'

interface OwnedTransport {
  _stream: { _online: () => void }
  disconnect(options: { _permanent: true }): unknown
}

const ONLINE_EVENT = 'online'
const NATIVE_ONLINE_LISTENER = 'bound _online'

/**
 * Native Meteor browser streams retain a bound online listener after disconnect.
 * Capture that specific constructor-time listener without recording unrelated
 * events or modifying application streams. Custom/minified listener names are
 * unsupported: fail closed instead of claiming complete disposal.
 *
 * The factory must synchronously construct one standard Meteor connection.
 * Listener interception exists only on the supplied event target for that call.
 */
export const createOwnedConnection = <TConnection extends OwnedTransport>(
  registry: ConnectionRegistry<TConnection>,
  ownership: ConnectionOwnership,
  factory: () => TConnection,
  eventTarget: EventTarget = globalThis,
) => {
  const existingConnections = new WeakSet(
    [...registry.list(), ...registry.listOwned()].map(item => item.connection),
  )
  const originalAdd = eventTarget.addEventListener
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    eventTarget,
    'addEventListener',
  )
  const captured: {
    listener: EventListener
    options?: boolean | AddEventListenerOptions
  }[] = []
  let connection: TConnection | undefined
  let disposed = false

  const removeListeners = () => {
    for (const { listener, options } of captured) {
      eventTarget.removeEventListener(ONLINE_EVENT, listener, options)
    }
    captured.length = 0
  }

  eventTarget.addEventListener = function (type, listener, options) {
    const constructingOwner = registry.getConstructionOwnership()
    if (
      constructingOwner?.requestId === ownership.requestId &&
      constructingOwner.panelSessionId === ownership.panelSessionId &&
      constructingOwner.pageEpoch === ownership.pageEpoch &&
      type === ONLINE_EVENT &&
      typeof listener === 'function' &&
      listener.name === NATIVE_ONLINE_LISTENER
    ) {
      captured.push({ listener, options })
    }
    // eslint-disable-next-line unicorn/no-this-outside-of-class -- Preserve EventTarget's required receiver.
    return originalAdd.call(this, type, listener, options)
  }

  try {
    const descriptor = registry.createOwned(ownership, () => {
      connection = factory()
      if (
        captured.length !== 1 ||
        typeof connection._stream._online !== 'function'
      ) {
        throw new Error(
          'Native owned transport listener capability unavailable',
        )
      }
      return connection
    })

    return {
      descriptor,
      dispose: () => {
        if (disposed) return
        disposed = true
        try {
          descriptor.connection.disconnect({ _permanent: true })
        } finally {
          removeListeners()
          registry.disposeOwned(descriptor.id)
        }
      },
    }
  } catch (error) {
    removeListeners()
    if (connection && !existingConnections.has(connection)) {
      try {
        connection.disconnect({ _permanent: true })
      } finally {
        const descriptor = registry
          .listOwned()
          .find(item => item.connection === connection)
        if (descriptor) registry.disposeOwned(descriptor.id)
      }
    }
    throw error
  } finally {
    if (originalDescriptor)
      Object.defineProperty(eventTarget, 'addEventListener', originalDescriptor)
    else Reflect.deleteProperty(eventTarget, 'addEventListener')
  }
}

export interface ConnectionOwnership {
  readonly parentConnectionId: string
  readonly pageEpoch: string
  readonly panelSessionId: string
  readonly requestId: string
}

export interface ConnectionDescriptor<TConnection extends object = object> {
  connection: TConnection
  displayName: string
  id: string
  ownership?: Readonly<ConnectionOwnership>
}

type ConnectionListener<TConnection extends object> = (
  descriptor: ConnectionDescriptor<TConnection>,
) => void

const DEFAULT_CONNECTION_ID = 'default'
const DEFAULT_CONNECTION_NAME = 'Default connection'
const CONNECTION_ID_PREFIX = 'connection-'
const CONNECTION_NAME_PREFIX = 'Connection '

export const createConnectionRegistry = <TConnection extends object>(
  defaultConnection: TConnection,
) => {
  const defaultDescriptor: ConnectionDescriptor<TConnection> = {
    connection: defaultConnection,
    displayName: DEFAULT_CONNECTION_NAME,
    id: DEFAULT_CONNECTION_ID,
  }
  const descriptors: ConnectionDescriptor<TConnection>[] = [defaultDescriptor]
  const disposed = new WeakSet<TConnection>()
  let pendingOwnership: Readonly<ConnectionOwnership> | undefined
  let constructingOwnership: Readonly<ConnectionOwnership> | undefined
  const descriptorsByConnection = new WeakMap<
    TConnection,
    ConnectionDescriptor<TConnection>
  >([[defaultConnection, defaultDescriptor]])
  const listeners = new Set<ConnectionListener<TConnection>>()
  let nextConnectionId = 1

  const register = (
    connection: TConnection,
    ownership?: Readonly<ConnectionOwnership>,
  ): ConnectionDescriptor<TConnection> => {
    if (disposed.has(connection))
      throw new Error('Cannot register a disposed owned connection')
    const existing = descriptorsByConnection.get(connection)

    if (existing) {
      if (ownership && !existing.ownership)
        throw new Error('Cannot claim an application connection')
      if (ownership && existing.ownership !== ownership)
        throw new Error('Cannot claim another owned connection')
      return existing
    }

    const descriptor: ConnectionDescriptor<TConnection> = {
      ...(ownership ? { ownership } : {}),
      connection,
      displayName: `${CONNECTION_NAME_PREFIX}${nextConnectionId}`,
      id: `${CONNECTION_ID_PREFIX}${nextConnectionId}`,
    }
    nextConnectionId += 1
    descriptors.push(descriptor)
    descriptorsByConnection.set(connection, descriptor)

    for (const listener of listeners) listener(descriptor)

    return descriptor
  }

  const get = (id: string): ConnectionDescriptor<TConnection> | undefined =>
    descriptors.find(descriptor => descriptor.id === id)

  const list = (): ConnectionDescriptor<TConnection>[] =>
    descriptors.filter(item => !item.ownership)
  const listOwned = (): ConnectionDescriptor<TConnection>[] =>
    descriptors.filter(item => item.ownership)

  /**
   * Consume before invoking the native constructor so nested DDP.connect calls
   * and registration listeners cannot inherit the outer connection's ownership.
   */
  const takePendingOwnership = () => {
    const ownership = pendingOwnership
    pendingOwnership = undefined
    return ownership
  }

  const getConstructionOwnership = () =>
    constructingOwnership ?? pendingOwnership

  const construct = (factory: () => TConnection) => {
    const ownership = takePendingOwnership()
    const previousOwnership = constructingOwnership
    constructingOwnership = ownership
    let connection: TConnection
    try {
      connection = factory()
    } finally {
      constructingOwnership = previousOwnership
    }
    return register(connection, ownership).connection
  }

  const createOwned = (
    owner: ConnectionOwnership,
    factory: () => TConnection,
  ) => {
    const parent = get(owner.parentConnectionId)
    if (!parent || parent.ownership)
      throw new Error('Owned connection requires an application parent')
    if (pendingOwnership) throw new Error('Owned construction already pending')
    const ownership = Object.freeze({ ...owner })
    pendingOwnership = ownership
    try {
      return register(factory(), ownership)
    } finally {
      pendingOwnership = undefined
    }
  }

  const disposeOwned = (id: string): void => {
    const descriptor = get(id)
    if (!descriptor) return
    if (!descriptor.ownership)
      throw new Error('Cannot dispose an application connection')
    descriptors.splice(descriptors.indexOf(descriptor), 1)
    descriptorsByConnection.delete(descriptor.connection)
    disposed.add(descriptor.connection)
  }

  const subscribe = (
    listener: ConnectionListener<TConnection>,
  ): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  return {
    construct,
    createOwned,
    getConstructionOwnership,
    disposeOwned,
    get,
    list,
    listOwned,
    register,
    subscribe,
    takePendingOwnership,
  }
}

export type ConnectionRegistry<TConnection extends object = object> =
  ReturnType<typeof createConnectionRegistry<TConnection>>

const instrumentedConnectors = new WeakSet<object>()

export const installDDPConnectRegistry = <
  TConnection extends object,
  TArguments extends unknown[],
>(
  ddp: { connect: (...args: TArguments) => TConnection },
  registry: ConnectionRegistry<TConnection>,
): void => {
  const originalConnect = ddp.connect

  if (instrumentedConnectors.has(originalConnect)) return

  const instrumentedConnect = new Proxy(originalConnect, {
    apply(target, thisArgument, args) {
      return registry.construct(() => Reflect.apply(target, thisArgument, args))
    },
  })

  instrumentedConnectors.add(instrumentedConnect)
  ddp.connect = instrumentedConnect
}

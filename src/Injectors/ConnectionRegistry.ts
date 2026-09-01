export interface ConnectionDescriptor<TConnection extends object = object> {
  connection: TConnection
  displayName: string
  id: string
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
  const descriptors: ConnectionDescriptor<TConnection>[] = [
    {
      connection: defaultConnection,
      displayName: DEFAULT_CONNECTION_NAME,
      id: DEFAULT_CONNECTION_ID,
    },
  ]
  const descriptorsByConnection = new WeakMap<
    TConnection,
    ConnectionDescriptor<TConnection>
  >([[defaultConnection, descriptors[0]]])
  const listeners = new Set<ConnectionListener<TConnection>>()
  let nextConnectionId = 1

  const register = (
    connection: TConnection,
  ): ConnectionDescriptor<TConnection> => {
    const existing = descriptorsByConnection.get(connection)

    if (existing) return existing

    const descriptor = {
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

  const list = (): ConnectionDescriptor<TConnection>[] => [...descriptors]

  const subscribe = (
    listener: ConnectionListener<TConnection>,
  ): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  return { get, list, register, subscribe }
}

export type ConnectionRegistry<TConnection extends object = object> =
  ReturnType<typeof createConnectionRegistry<TConnection>>

type DDPConnect<TConnection extends object> = (
  ...args: unknown[]
) => TConnection

interface DDPNamespace<TConnection extends object> {
  connect: DDPConnect<TConnection>
}

const instrumentedConnectors = new WeakSet<object>()

export const installDDPConnectRegistry = <TConnection extends object>(
  ddp: DDPNamespace<TConnection>,
  registry: ConnectionRegistry<TConnection>,
): void => {
  const originalConnect = ddp.connect

  if (instrumentedConnectors.has(originalConnect)) return

  const instrumentedConnect = new Proxy(originalConnect, {
    apply(target, thisArgument, args) {
      const connection = Reflect.apply(target, thisArgument, args)
      registry.register(connection)
      return connection
    },
  })

  instrumentedConnectors.add(instrumentedConnect)
  ddp.connect = instrumentedConnect
}

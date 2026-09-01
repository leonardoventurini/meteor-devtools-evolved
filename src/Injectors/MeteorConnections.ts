import {
  createConnectionRegistry,
  installDDPConnectRegistry,
  type ConnectionRegistry,
} from './ConnectionRegistry'

let connectionRegistry: ConnectionRegistry<DDPConnection> | null = null

export const initializeMeteorConnections = (
  defaultConnection: DDPConnection,
  ddp: { connect: (...args: unknown[]) => DDPConnection },
): ConnectionRegistry<DDPConnection> => {
  if (connectionRegistry) return connectionRegistry

  connectionRegistry = createConnectionRegistry(defaultConnection)
  installDDPConnectRegistry(ddp, connectionRegistry)
  return connectionRegistry
}

export const getMeteorConnections = (): ConnectionRegistry<DDPConnection> => {
  if (!connectionRegistry) {
    throw new Error('Meteor connection registry has not been initialized.')
  }

  return connectionRegistry
}

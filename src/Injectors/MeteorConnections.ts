import {
  createConnectionRegistry,
  installDDPConnectRegistry,
  type ConnectionRegistry,
} from './ConnectionRegistry'

let connectionRegistry: ConnectionRegistry<DDPConnection> | null = null

const registerExistingConnections = (
  registry: ConnectionRegistry<DDPConnection>,
  defaultConnection: DDPConnection,
  mongo?: Pick<typeof Mongo, '_collections'>,
): void => {
  for (const collection of mongo?._collections?.values() ?? []) {
    const connection = collection._connection

    if (connection && connection !== defaultConnection) {
      registry.register(connection)
    }
  }
}

export const initializeMeteorConnections = (
  defaultConnection: DDPConnection,
  ddp: { connect: (...args: unknown[]) => DDPConnection },
  mongo?: Pick<typeof Mongo, '_collections'>,
): ConnectionRegistry<DDPConnection> => {
  if (!connectionRegistry) {
    connectionRegistry = createConnectionRegistry(defaultConnection)
    installDDPConnectRegistry(ddp, connectionRegistry)
  }

  /**
   * Classic Meteor bundles can create collections during module evaluation,
   * before a document-start extension script observes the DDP namespace. Their
   * collection connections provide the only stable recovery path for those
   * already-created DDP clients.
   */
  registerExistingConnections(connectionRegistry, defaultConnection, mongo)
  return connectionRegistry
}

export const getMeteorConnections = (): ConnectionRegistry<DDPConnection> => {
  if (!connectionRegistry) {
    throw new Error('Meteor connection registry has not been initialized.')
  }

  return connectionRegistry
}

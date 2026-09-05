import { sendLogMessage } from '@/Browser/Inject'
import { getMeteorConnections } from './MeteorConnections'
import type { ConnectionDescriptor } from './ConnectionRegistry'

type MessageCallback = (message: DDPLog) => void

const generateId = () => (Date.now() + Math.random()).toString(36)

const instrumentedStreams = new WeakSet<object>()

export const instrumentDDPConnection = (
  descriptor: ConnectionDescriptor<DDPConnection>,
  callback: MessageCallback,
) => {
  // Owned traffic bypasses ordinary capture, including internal login frames.
  if (descriptor.ownership) return

  const { connection, id: connectionId } = descriptor
  const { _stream: stream } = connection

  if (instrumentedStreams.has(stream)) return
  instrumentedStreams.add(stream)

  const send = stream.send

  stream.send = function (...args) {
    // Preserve the receiver expected by Meteor's stream implementation.
    // eslint-disable-next-line unicorn/no-this-outside-of-class
    const result = send.apply(this, args)

    callback({
      connectionId,
      id: generateId(),
      content: args[0],
      isOutbound: true,
      timestamp: Date.now(),
    })

    return result
  }

  stream.on('message', (...args) => {
    callback({
      connectionId,
      id: generateId(),
      content: args[0],
      isInbound: true,
      timestamp: Date.now(),
    })
  })
}

export const DDPInjector = () => {
  const registry = getMeteorConnections()

  for (const descriptor of registry.list()) {
    instrumentDDPConnection(descriptor, sendLogMessage)
  }

  registry.subscribe(descriptor => {
    instrumentDDPConnection(descriptor, sendLogMessage)
  })
}

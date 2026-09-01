interface ConnectionScopedValue {
  connectionId: string
}

export const isLogForConnection = (
  value: ConnectionScopedValue,
  connectionId: string,
): boolean => value.connectionId === connectionId

export const shouldAcceptConnectionPayload = (
  activeConnectionId: string,
  payloadConnectionId: string,
): boolean => activeConnectionId === payloadConnectionId

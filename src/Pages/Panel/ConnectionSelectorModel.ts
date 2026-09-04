export type ConnectionDirection = -1 | 1

export const resolveActiveConnectionId = (
  connections: readonly ConnectionSummary[],
  activeConnectionId: string,
): string | undefined =>
  connections.some(connection => connection.id === activeConnectionId)
    ? activeConnectionId
    : connections[0]?.id

export const getAdjacentConnectionId = (
  connections: readonly ConnectionSummary[],
  currentConnectionId: string,
  direction: ConnectionDirection,
): string | undefined => {
  if (connections.length === 0) return undefined

  const currentIndex = connections.findIndex(
    connection => connection.id === currentConnectionId,
  )
  if (currentIndex === -1) return connections[0]?.id

  const nextIndex =
    (currentIndex + direction + connections.length) % connections.length

  return connections[nextIndex]?.id
}

export const findConnectionByPrefix = (
  connections: readonly ConnectionSummary[],
  currentConnectionId: string,
  prefix: string,
): string | undefined => {
  if (connections.length === 0 || prefix.length === 0) return undefined

  const normalizedPrefix = prefix.toLocaleLowerCase()
  const currentIndex = connections.findIndex(
    connection => connection.id === currentConnectionId,
  )
  const startIndex = currentIndex === -1 ? -1 : currentIndex

  for (let offset = 1; offset <= connections.length; offset += 1) {
    const index = (startIndex + offset) % connections.length
    const connection = connections[index]

    if (
      connection?.displayName.toLocaleLowerCase().startsWith(normalizedPrefix)
    ) {
      return connection.id
    }
  }

  return undefined
}

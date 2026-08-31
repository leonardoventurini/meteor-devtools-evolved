interface StructuredCloneScope {
  structuredClone<T>(value: T): T
}

const cloneDeep = <T>(value: T): T =>
  (globalThis as typeof globalThis & StructuredCloneScope).structuredClone(
    value,
  )

const formatStructuredValue = (value: unknown): unknown => {
  if (value === null || typeof value !== 'object') return value

  if (value instanceof Date) {
    return `[Object::Date] ${value.toISOString()}`
  }

  if (Array.isArray(value)) {
    return value.map(item => formatStructuredValue(item))
  }

  const constructorName = value.constructor?.name

  if (constructorName && constructorName !== 'Object') {
    const stringValue = String(value)
    return `[Object::${constructorName}]${
      stringValue === '[object Object]' ? '' : ` ${stringValue}`
    }`
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      formatStructuredValue(nestedValue),
    ]),
  )
}

/**
 * Produces a transport-safe snapshot without dropping valid falsy fields or
 * returning early while traversing nested arrays and structured values.
 */
export const cleanupDocument = (value: unknown): unknown =>
  formatStructuredValue(cloneDeep(value))

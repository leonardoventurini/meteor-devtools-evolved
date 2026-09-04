import JSON5 from 'json5'

const FIELD_OPERATORS = new Set([
  '$eq',
  '$ne',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$in',
  '$nin',
  '$exists',
])
const LOGICAL_OPERATORS = new Set(['$and', '$or'])
const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype'])

type QueryRecord = Record<string, unknown>
type SortDirection = 1 | -1

export interface MinimongoQueryInput {
  limit: string
  projection: string
  selector: string
  sort: string
}

export interface MinimongoQuery {
  limit: number
  projection: Record<string, 0 | 1>
  selector: QueryRecord
  sort: Record<string, SortDirection>
}

export interface QueryDocumentEntry {
  document: IDocument
}

export class MinimongoQueryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MinimongoQueryError'
  }
}

const isRecord = (value: unknown): value is QueryRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const assertSafePath = (path: string): void => {
  if (
    !path ||
    path.split('.').some(segment => UNSAFE_PATH_SEGMENTS.has(segment))
  ) {
    throw new MinimongoQueryError(`Unsafe field path: ${path || '(empty)'}`)
  }
}

const parseRecord = (source: string, label: string): QueryRecord => {
  let value: unknown

  try {
    value = JSON5.parse(source.trim() || '{}')
  } catch {
    throw new MinimongoQueryError(
      `${label} must be a valid Compass-style object.`,
    )
  }

  if (!isRecord(value)) {
    throw new MinimongoQueryError(`${label} must be an object.`)
  }

  return value
}

const validateFieldCondition = (condition: unknown): void => {
  if (!isRecord(condition)) return

  const operatorKeys = Object.keys(condition).filter(key => key.startsWith('$'))

  if (operatorKeys.length === 0) return
  if (operatorKeys.length !== Object.keys(condition).length) {
    throw new MinimongoQueryError(
      'Field conditions cannot mix operators and literal object fields.',
    )
  }

  for (const operator of operatorKeys) {
    if (!FIELD_OPERATORS.has(operator)) {
      throw new MinimongoQueryError(
        `Unsupported selector operator: ${operator}`,
      )
    }

    const operand = condition[operator]

    if (
      (operator === '$in' || operator === '$nin') &&
      !Array.isArray(operand)
    ) {
      throw new MinimongoQueryError(`${operator} requires an array.`)
    }

    if (operator === '$exists' && typeof operand !== 'boolean') {
      throw new MinimongoQueryError('$exists requires a boolean.')
    }
  }
}

const validateSelector = (selector: QueryRecord): void => {
  for (const [field, condition] of Object.entries(selector)) {
    if (field.startsWith('$')) {
      if (!LOGICAL_OPERATORS.has(field)) {
        throw new MinimongoQueryError(`Unsupported selector operator: ${field}`)
      }
      if (!Array.isArray(condition) || !condition.every(isRecord)) {
        throw new MinimongoQueryError(
          `${field} requires an array of selectors.`,
        )
      }
      for (const nestedSelector of condition) validateSelector(nestedSelector)
      continue
    }

    assertSafePath(field)
    validateFieldCondition(condition)
  }
}

const parseSort = (source: string): Record<string, SortDirection> => {
  const parsed = parseRecord(source, 'Sort')
  const sort: Record<string, SortDirection> = {}

  for (const [field, direction] of Object.entries(parsed)) {
    assertSafePath(field)
    if (direction !== 1 && direction !== -1) {
      throw new MinimongoQueryError('Sort directions must be 1 or -1.')
    }
    sort[field] = direction
  }

  return sort
}

const parseProjection = (source: string): Record<string, 0 | 1> => {
  const parsed = parseRecord(source, 'Projection')
  const projection: Record<string, 0 | 1> = {}
  const nonIdModes = new Set<number>()

  for (const [field, mode] of Object.entries(parsed)) {
    assertSafePath(field)
    if (mode !== 0 && mode !== 1) {
      throw new MinimongoQueryError('Projection values must be 0 or 1.')
    }
    projection[field] = mode
    if (field !== '_id') nonIdModes.add(mode)
  }

  if (nonIdModes.size > 1) {
    throw new MinimongoQueryError(
      'Projection cannot mix included and excluded fields.',
    )
  }

  return projection
}

export const parseMinimongoQuery = (
  input: MinimongoQueryInput,
): MinimongoQuery => {
  const selector = parseRecord(input.selector, 'Selector')
  validateSelector(selector)

  const limit = Number(input.limit)
  if (!Number.isInteger(limit) || limit < 1) {
    throw new MinimongoQueryError('Limit must be a positive integer.')
  }

  return {
    limit,
    projection: parseProjection(input.projection),
    selector,
    sort: parseSort(input.sort),
  }
}

const getPath = (value: unknown, path: string): unknown => {
  let current = value

  for (const segment of path.split('.')) {
    if (!isRecord(current) && !Array.isArray(current)) return undefined
    current = current[segment as keyof typeof current]
  }

  return current
}

const valuesEqual = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

const matchesCondition = (value: unknown, condition: unknown): boolean => {
  if (
    !isRecord(condition) ||
    !Object.keys(condition).some(key => key.startsWith('$'))
  ) {
    return valuesEqual(value, condition)
  }

  return Object.entries(condition).every(([operator, operand]) => {
    switch (operator) {
      case '$eq': {
        if (operand === null) return value === null || value === undefined

        return valuesEqual(value, operand)
      }
      case '$ne': {
        if (operand === null) return value !== null && value !== undefined

        return !valuesEqual(value, operand)
      }
      case '$gt': {
        return value > operand
      }
      case '$gte': {
        return value >= operand
      }
      case '$lt': {
        return value < operand
      }
      case '$lte': {
        return value <= operand
      }
      case '$in': {
        return (operand as unknown[]).some(item => valuesEqual(value, item))
      }
      case '$nin': {
        return !(operand as unknown[]).some(item => valuesEqual(value, item))
      }
      case '$exists': {
        return (value !== undefined) === operand
      }
      default: {
        return false
      }
    }
  })
}

const matchesSelector = (document: IDocument, selector: QueryRecord): boolean =>
  Object.entries(selector).every(([field, condition]) => {
    if (field === '$and') {
      return (condition as QueryRecord[]).every(nested =>
        matchesSelector(document, nested),
      )
    }
    if (field === '$or') {
      return (condition as QueryRecord[]).some(nested =>
        matchesSelector(document, nested),
      )
    }

    return matchesCondition(getPath(document, field), condition)
  })

const setPath = (target: QueryRecord, path: string, value: unknown): void => {
  const segments = path.split('.')
  let current = target

  for (const segment of segments.slice(0, -1)) {
    const nested = current[segment]
    if (!isRecord(nested)) current[segment] = {}
    current = current[segment] as QueryRecord
  }

  current[segments.at(-1) as string] = value
}

const deletePath = (target: QueryRecord, path: string): void => {
  const segments = path.split('.')
  let current: QueryRecord = target

  for (const segment of segments.slice(0, -1)) {
    const nested = current[segment]
    if (!isRecord(nested)) return
    current = nested
  }

  delete current[segments.at(-1) as string]
}

const projectDocument = (
  document: IDocument,
  projection: Record<string, 0 | 1>,
): IDocument => {
  const entries = Object.entries(projection)
  if (entries.length === 0) return document

  const isInclusion = entries.some(
    ([field, mode]) => field !== '_id' && mode === 1,
  )

  if (isInclusion) {
    const projected: QueryRecord = {}
    if (projection._id !== 0 && document._id !== undefined) {
      projected._id = document._id
    }
    for (const [field, mode] of entries) {
      if (field === '_id' || mode === 0) continue
      const value = getPath(document, field)
      if (value !== undefined) setPath(projected, field, value)
    }
    return projected as IDocument
  }

  const projected = structuredClone(document) as QueryRecord
  for (const [field, mode] of entries) {
    if (mode === 0) deletePath(projected, field)
  }
  return projected as IDocument
}

export const executeMinimongoQueryEntries = <TEntry extends QueryDocumentEntry>(
  entries: TEntry[],
  query: MinimongoQuery,
): Array<TEntry & QueryDocumentEntry> => {
  const sortEntries = Object.entries(query.sort)

  return entries
    .filter(entry => matchesSelector(entry.document, query.selector))
    .toSorted((left, right) => {
      for (const [field, direction] of sortEntries) {
        const leftValue = getPath(left.document, field)
        const rightValue = getPath(right.document, field)
        if (valuesEqual(leftValue, rightValue)) continue
        return (leftValue < rightValue ? -1 : 1) * direction
      }
      return 0
    })
    .slice(0, query.limit)
    .map(entry => ({
      ...entry,
      document: projectDocument(entry.document, query.projection),
    }))
}

export const executeMinimongoQuery = (
  documents: IDocument[],
  query: MinimongoQuery,
): IDocument[] =>
  executeMinimongoQueryEntries(
    documents.map(document => ({ document })),
    query,
  ).map(entry => entry.document)

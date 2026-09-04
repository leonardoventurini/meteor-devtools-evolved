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
  '$contains',
  '$regex',
  '$options',
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

interface RegexLiteralParseResult {
  source: string
  tokens: Map<string, RegExp>
}

/**
 * Converts regex literals only in object/array value positions into temporary
 * JSON strings. JSON5 remains the authoritative object parser, and only tokens
 * created during this parse are hydrated back into RegExp instances.
 */
const extractRegexLiterals = (source: string): RegexLiteralParseResult => {
  const tokens = new Map<string, RegExp>()
  let output = ''
  let index = 0
  let previousSignificantCharacter = ''

  while (index < source.length) {
    const character = source[index]

    if (character === '"' || character === "'") {
      const quote = character
      output += character
      index += 1

      while (index < source.length) {
        const stringCharacter = source[index]
        output += stringCharacter
        index += 1

        if (stringCharacter === '\\') {
          output += source[index] ?? ''
          index += 1
        } else if (stringCharacter === quote) {
          break
        }
      }

      previousSignificantCharacter = quote
      continue
    }

    if (character === '/' && source[index + 1] === '/') {
      const commentEnd = source.indexOf('\n', index)
      const end = commentEnd === -1 ? source.length : commentEnd
      output += source.slice(index, end)
      index = end
      continue
    }

    if (character === '/' && source[index + 1] === '*') {
      const commentEnd = source.indexOf('*/', index + 2)
      if (commentEnd === -1) {
        throw new MinimongoQueryError(
          'Selector contains an unterminated comment.',
        )
      }
      output += source.slice(index, commentEnd + 2)
      index = commentEnd + 2
      continue
    }

    const isRegexValue =
      character === '/' && ':,['.includes(previousSignificantCharacter)

    if (isRegexValue) {
      const literalStart = index
      let inCharacterClass = false
      let isEscaped = false
      index += 1

      regexPattern: while (index < source.length) {
        const patternCharacter = source[index]

        if (isEscaped) {
          isEscaped = false
        } else {
          switch (patternCharacter) {
            case '\\': {
              isEscaped = true
              break
            }
            case '[': {
              inCharacterClass = true
              break
            }
            case ']': {
              inCharacterClass = false
              break
            }
            case '/': {
              if (!inCharacterClass) break regexPattern
              break
            }
            case '\n':
            case '\r': {
              throw new MinimongoQueryError(
                'Selector contains an unterminated regular expression.',
              )
            }
          }
        }

        index += 1
      }

      if (source[index] !== '/') {
        throw new MinimongoQueryError(
          'Selector contains an unterminated regular expression.',
        )
      }

      const pattern = source.slice(literalStart + 1, index)
      index += 1
      const flagsStart = index
      while (/[a-z]/i.test(source[index] ?? '')) index += 1
      const flags = source.slice(flagsStart, index)
      let expression: RegExp

      try {
        expression = new RegExp(pattern, flags)
      } catch {
        throw new MinimongoQueryError(
          'Selector contains an invalid regular expression.',
        )
      }

      const token = `__MDE_REGEX_LITERAL_${crypto.randomUUID()}__`
      tokens.set(token, expression)
      output += JSON.stringify(token)
      previousSignificantCharacter = 'v'
      continue
    }

    output += character
    index += 1

    if (!/\s/.test(character)) previousSignificantCharacter = character
  }

  return { source: output, tokens }
}

const hydrateRegexLiterals = (
  value: unknown,
  tokens: ReadonlyMap<string, RegExp>,
): unknown => {
  if (typeof value === 'string') return tokens.get(value) ?? value
  if (Array.isArray(value)) {
    return value.map(item => hydrateRegexLiterals(item, tokens))
  }
  if (!isRecord(value)) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      hydrateRegexLiterals(nestedValue, tokens),
    ]),
  )
}

const assertSafePath = (path: string): void => {
  if (
    !path ||
    path.split('.').some(segment => UNSAFE_PATH_SEGMENTS.has(segment))
  ) {
    throw new MinimongoQueryError(`Unsafe field path: ${path || '(empty)'}`)
  }
}

const parseRecord = (
  source: string,
  label: string,
  allowRegexLiterals = false,
): QueryRecord => {
  let value: unknown

  try {
    const normalizedSource = source.trim() || '{}'
    const extracted = allowRegexLiterals
      ? extractRegexLiterals(normalizedSource)
      : { source: normalizedSource, tokens: new Map<string, RegExp>() }
    value = hydrateRegexLiterals(
      JSON5.parse(extracted.source),
      extracted.tokens,
    )
  } catch (error) {
    if (error instanceof MinimongoQueryError) throw error

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
  if (condition instanceof RegExp) return
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

    if (operator === '$contains' && typeof operand !== 'string') {
      throw new MinimongoQueryError('$contains requires a string.')
    }

    if (
      operator === '$regex' &&
      typeof operand !== 'string' &&
      !(operand instanceof RegExp)
    ) {
      throw new MinimongoQueryError(
        '$regex requires a string or regex literal.',
      )
    }

    if (operator === '$options' && typeof operand !== 'string') {
      throw new MinimongoQueryError('$options requires a string.')
    }
  }

  if ('$options' in condition && !('$regex' in condition)) {
    throw new MinimongoQueryError('$options requires $regex.')
  }

  if ('$regex' in condition) {
    compileRegex(condition.$regex, condition.$options)
  }
}

const compileRegex = (pattern: unknown, options?: unknown): RegExp => {
  const source =
    pattern instanceof RegExp ? pattern.source : (pattern as string)
  let flags = ''

  if (options !== undefined) {
    const optionFlags = String(options)
    flags =
      pattern instanceof RegExp
        ? [...new Set(pattern.flags + optionFlags)].join('')
        : optionFlags
  } else if (pattern instanceof RegExp) flags = pattern.flags

  try {
    return new RegExp(source, flags)
  } catch {
    throw new MinimongoQueryError(
      'Selector contains an invalid regular expression.',
    )
  }
}

const normalizeFieldCondition = (condition: unknown): unknown => {
  if (!isRecord(condition) || !('$regex' in condition)) return condition

  return Object.fromEntries([
    ...Object.entries(condition).filter(
      ([operator]) => operator !== '$regex' && operator !== '$options',
    ),
    ['$regex', compileRegex(condition.$regex, condition.$options)],
  ])
}

const normalizeSelector = (selector: QueryRecord): QueryRecord =>
  Object.fromEntries(
    Object.entries(selector).map(([field, condition]) => [
      field,
      field === '$and' || field === '$or'
        ? (condition as QueryRecord[]).map(nested => normalizeSelector(nested))
        : normalizeFieldCondition(condition),
    ]),
  )

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
  const selector = parseRecord(input.selector, 'Selector', true)
  validateSelector(selector)

  const limit = Number(input.limit)
  if (!Number.isInteger(limit) || limit < 1) {
    throw new MinimongoQueryError('Limit must be a positive integer.')
  }

  return {
    limit,
    projection: parseProjection(input.projection),
    selector: normalizeSelector(selector),
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

const matchesRegex = (value: unknown, expression: RegExp): boolean => {
  if (typeof value !== 'string') return false

  expression.lastIndex = 0
  const matches = expression.test(value)
  expression.lastIndex = 0

  return matches
}

const matchesOperand = (value: unknown, operand: unknown): boolean =>
  operand instanceof RegExp
    ? matchesRegex(value, operand)
    : valuesEqual(value, operand)

const matchesCondition = (value: unknown, condition: unknown): boolean => {
  if (condition instanceof RegExp) return matchesRegex(value, condition)

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
        return (operand as unknown[]).some(item => matchesOperand(value, item))
      }
      case '$nin': {
        return !(operand as unknown[]).some(item => matchesOperand(value, item))
      }
      case '$exists': {
        return (value !== undefined) === operand
      }
      case '$contains': {
        return typeof value === 'string' && value.includes(operand as string)
      }
      case '$regex': {
        return matchesRegex(value, operand as RegExp)
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

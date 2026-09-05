import type { ExecutionContext, Operation } from './Commands'
import {
  redactValue,
  type EvidenceSnapshot,
  type Expectation,
} from './Evidence'
import {
  PLAYGROUND_FILE_FORMAT,
  PLAYGROUND_FORMAT_VERSION,
  PLAYGROUND_LIMITS,
} from './Limits'
import { generateMatrix, type MatrixDefinition } from './Matrix'
import { parsePointer } from './Pointer'
import {
  parseParameters,
  serializedBytes,
  validateValue,
  type EncodedValue,
} from './Values'

export interface SavedCase {
  id: string
  version: typeof PLAYGROUND_FORMAT_VERSION
  revision: number
  title?: string
  createdAt: number
  updatedAt: number
  operation: Operation
  context: ExecutionContext
  endpointHint?: string
  notes?: string
  tags: string[]
  expectations: Expectation[]
  matrix?: MatrixDefinition
  excludedPaths: string[]
  redactedPaths: string[]
}
export interface SavedSnapshot {
  id: string
  version: typeof PLAYGROUND_FORMAT_VERSION
  capturedAt: number
  caseId?: string
  caseRevision?: number
  request: {
    operation: Operation
    context: ExecutionContext
    sessionLabel?: string
  }
  endpointLabel?: string
  authentication: {
    state: 'anonymous' | 'authenticated' | 'unknown'
    userId?: EncodedValue
    observedAt: number
    provenance: string
  }
  semantics: string
  outcome: string
  completion: { result: boolean; writes: boolean; ready: boolean }
  evidence: EvidenceSnapshot
  timing: { startedAt: number; responseMs?: number; completedMs?: number }
  incompleteReasons: string[]
  redactedPaths: string[]
}
export interface PlaygroundFile {
  format: typeof PLAYGROUND_FILE_FORMAT
  version: typeof PLAYGROUND_FORMAT_VERSION
  exportedAt: number
  cases: SavedCase[]
  snapshots: SavedSnapshot[]
}
const AUTHENTICATION_METHODS: ReadonlySet<string> = new Set([
  'login',
  'createUser',
  'changePassword',
  'resetPassword',
])
const CREDENTIAL_FIELDS: ReadonlySet<string> = new Set([
  'resume',
  'password',
  'token',
  'oldPassword',
  'newPassword',
])
type ObjectValue = Record<string, EncodedValue>
const object = (
  value: EncodedValue | undefined,
  keys: readonly string[],
): ObjectValue => {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('Expected a record object.')
  if (Object.keys(value).some(key => !keys.includes(key)))
    throw new TypeError('Unknown record field.')
  return value
}
const string = (value: EncodedValue | undefined, max = 4096): string => {
  if (typeof value !== 'string' || value.length > max)
    throw new TypeError('Invalid record text.')
  return value
}
const number = (value: EncodedValue | undefined, min = 0): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min)
    throw new TypeError('Invalid record number.')
  return value
}
const integer = (value: EncodedValue | undefined, min = 0): number => {
  const n = number(value, min)
  if (!Number.isSafeInteger(n)) throw new TypeError('Expected an integer.')
  return n
}
const boolean = (value: EncodedValue | undefined): boolean => {
  if (typeof value !== 'boolean') throw new TypeError('Expected a boolean.')
  return value
}
const array = (value: EncodedValue | undefined): EncodedValue[] => {
  if (!Array.isArray(value)) throw new TypeError('Expected an array.')
  return value
}
const strings = (value: EncodedValue | undefined): string[] =>
  array(value).map(v => string(v))
const pointers = (value: EncodedValue | undefined): string[] =>
  strings(value).map(path => {
    parsePointer(path)
    return path
  })
const uuid = (value: EncodedValue | undefined): string => {
  const id = string(value)
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  )
    throw new TypeError('Expected a UUID.')
  return id
}
const version = (value: EncodedValue | undefined): 1 => {
  if (value !== 1) throw new TypeError('Unsupported record version.')
  return value
}
const oneOf = <T extends string>(
  value: EncodedValue | undefined,
  values: readonly T[],
): T => {
  if (typeof value !== 'string' || !values.includes(value as T))
    throw new TypeError('Invalid record enum.')
  return value as T
}
const context = (value: EncodedValue | undefined): ExecutionContext => {
  const v = object(value, ['mode', 'authentication'])
  if (v.mode === 'application' && v.authentication === 'current')
    return { mode: 'application', authentication: 'current' }
  if (v.mode === 'isolated')
    return {
      mode: 'isolated',
      authentication: oneOf(v.authentication, ['anonymous', 'reuse']),
    }
  throw new TypeError('Invalid execution context.')
}
const operation = (value: EncodedValue | undefined): Operation => {
  const v = object(value, ['kind', 'name', 'parameters'])
  const name = string(v.name, 256)
  if (!name.trim()) throw new TypeError('An operation name is required.')
  return {
    kind: oneOf(v.kind, ['method', 'subscription']),
    name,
    parameters: parseParameters(JSON.stringify(v.parameters)),
  }
}
const bounds = (v: ObjectValue): { min?: number; max?: number } => {
  const result = {
    ...(v.min === undefined ? {} : { min: number(v.min, -Number.MAX_VALUE) }),
    ...(v.max === undefined ? {} : { max: number(v.max, -Number.MAX_VALUE) }),
  }
  if (
    (result.min === undefined && result.max === undefined) ||
    (result.min !== undefined &&
      result.max !== undefined &&
      result.min > result.max)
  )
    throw new TypeError('Invalid inclusive bounds.')
  return result
}
export const parseExpectation = (input: unknown): Expectation => {
  validateValue(input)
  const v = object(input, [
    'kind',
    'path',
    'value',
    'code',
    'outcome',
    'min',
    'max',
    'collection',
    'boundary',
  ])
  const kind = string(v.kind)
  const exact = (keys: string[]): void => {
    object(v, ['kind', ...keys])
  }
  const path = (): string => {
    const p = string(v.path)
    parsePointer(p)
    return p
  }
  switch (kind) {
    case 'outcome': {
      exact(['outcome'])
      return { kind, outcome: oneOf(v.outcome, ['success', 'error']) }
    }
    case 'error-code': {
      exact(['code'])
      if (typeof v.code !== 'string' && typeof v.code !== 'number')
        throw new TypeError('Invalid error code.')
      return { kind, code: v.code }
    }
    case 'equals': {
      exact(['path', 'value'])
      if (v.value === undefined) throw new TypeError('Equality value required.')
      return { kind, path: path(), value: v.value }
    }
    case 'exists':
    case 'absent': {
      exact(['path'])
      return { kind, path: path() }
    }
    case 'number-bounds': {
      exact(['path', 'min', 'max'])
      return { kind, path: path(), ...bounds(v) }
    }
    case 'document-count': {
      exact(['collection', 'boundary', 'min', 'max'])
      const b = bounds(v)
      for (const n of Object.values(b)) integer(n)
      return {
        kind,
        collection: string(v.collection),
        boundary: oneOf(v.boundary, ['readiness', 'manual']),
        ...b,
      }
    }
    default: {
      throw new TypeError('Unknown expectation kind.')
    }
  }
}
const matrix = (
  input: EncodedValue,
  parameters: EncodedValue[],
  masked: boolean,
): MatrixDefinition => {
  const v = object(input, ['includeBaseline', 'changes'])
  const definition: MatrixDefinition = {
    includeBaseline: boolean(v.includeBaseline),
    changes: array(v.changes).map(item => {
      const change = object(item, ['path', 'candidates'])
      const path = string(change.path)
      parsePointer(path)
      if (path === '')
        throw new TypeError('Matrix requires a non-root pointer.')
      return {
        path,
        candidates: array(change.candidates).map(item => {
          const candidate = object(item, [
            'kind',
            'value',
            'boundary',
            'length',
          ])
          const kind = oneOf(candidate.kind, [
            'value',
            'alternate-id',
            'null',
            'missing',
            'wrong-type',
            'numeric-boundary',
            'string-boundary',
          ])
          if (kind === 'value' || kind === 'alternate-id') {
            object(candidate, ['kind', 'value'])
            if (candidate.value === undefined)
              throw new TypeError('Candidate value required.')
            parseParameters(JSON.stringify([candidate.value]))
            return { kind, value: candidate.value }
          }
          if (kind === 'numeric-boundary') {
            object(candidate, ['kind', 'boundary'])
            return {
              kind,
              boundary: number(candidate.boundary, -Number.MAX_VALUE),
            }
          }
          if (kind === 'string-boundary') {
            object(candidate, ['kind', 'length'])
            const length = integer(candidate.length)
            if (length >= PLAYGROUND_LIMITS.requestBytes - 4)
              throw new TypeError('String boundary exceeds request limit.')
            return { kind, length }
          }
          object(candidate, ['kind'])
          return { kind }
        }),
      }
    }),
  }
  if (!masked) generateMatrix(parameters, definition)
  return definition
}
const checked = (input: unknown, max: number): EncodedValue => {
  validateValue(input)
  if (serializedBytes(JSON.stringify(input)) > max)
    throw new TypeError('Record exceeds byte limit.')
  return input
}
export const parseCase = (input: unknown): SavedCase => {
  const v = object(checked(input, PLAYGROUND_LIMITS.runBytes), [
    'id',
    'version',
    'revision',
    'title',
    'createdAt',
    'updatedAt',
    'operation',
    'context',
    'endpointHint',
    'notes',
    'tags',
    'expectations',
    'matrix',
    'excludedPaths',
    'redactedPaths',
  ])
  const op = operation(v.operation)
  const masks = pointers(v.redactedPaths)
  return {
    id: uuid(v.id),
    version: version(v.version),
    revision: integer(v.revision, 1),
    ...(v.title === undefined && masks.includes('/title')
      ? {}
      : { title: string(v.title, 256) }),
    createdAt: number(v.createdAt),
    updatedAt: number(v.updatedAt),
    operation: op,
    context: context(v.context),
    ...(v.endpointHint === undefined
      ? {}
      : { endpointHint: string(v.endpointHint) }),
    ...(v.notes === undefined && masks.includes('/notes')
      ? {}
      : { notes: string(v.notes) }),
    tags: strings(v.tags),
    expectations: array(v.expectations).map(item => parseExpectation(item)),
    ...(v.matrix === undefined
      ? {}
      : { matrix: matrix(v.matrix, op.parameters, masks.length > 0) }),
    excludedPaths: pointers(v.excludedPaths),
    redactedPaths: masks,
  }
}
export const parseSnapshot = (input: unknown): SavedSnapshot => {
  const v = object(checked(input, PLAYGROUND_LIMITS.runBytes), [
    'id',
    'version',
    'capturedAt',
    'caseId',
    'caseRevision',
    'request',
    'endpointLabel',
    'authentication',
    'semantics',
    'outcome',
    'completion',
    'evidence',
    'timing',
    'incompleteReasons',
    'redactedPaths',
  ])
  const r = object(v.request, ['operation', 'context', 'sessionLabel']),
    a = object(v.authentication, [
      'state',
      'userId',
      'observedAt',
      'provenance',
    ]),
    c = object(v.completion, ['result', 'writes', 'ready']),
    e = object(v.evidence, [
      'data',
      'completePaths',
      'redactedPaths',
      'truncated',
      'documentBaseline',
      'boundary',
      'outcome',
    ]),
    t = object(v.timing, ['startedAt', 'responseMs', 'completedMs'])
  const masks = pointers(v.redactedPaths)
  const data = object(e.data, ['result', 'error', 'documents'])
  if (data.documents !== undefined) {
    const collections = data.documents
    if (
      collections === null ||
      typeof collections !== 'object' ||
      Array.isArray(collections)
    )
      throw new TypeError('Documents must be a collection map.')
    let count = 0
    for (const documents of Object.values(collections)) {
      if (
        documents === null ||
        typeof documents !== 'object' ||
        Array.isArray(documents)
      )
        throw new TypeError('Collections must map wire IDs to documents.')
      count += Object.keys(documents).length
      if (count > PLAYGROUND_LIMITS.documents)
        throw new TypeError('Snapshot exceeds document limit.')
      for (const document of Object.values(documents)) {
        if (
          document === null ||
          typeof document !== 'object' ||
          Array.isArray(document)
        )
          throw new TypeError('Expected document objects.')
      }
    }
  }
  const state = oneOf(a.state, ['anonymous', 'authenticated', 'unknown'])
  if (a.userId !== undefined && state !== 'authenticated')
    throw new TypeError('User ID requires authenticated observation.')
  if ((v.caseId === undefined) !== (v.caseRevision === undefined))
    throw new TypeError('Case reference requires ID and revision.')
  return {
    id: uuid(v.id),
    version: version(v.version),
    capturedAt: number(v.capturedAt),
    ...(v.caseId === undefined
      ? {}
      : { caseId: uuid(v.caseId), caseRevision: integer(v.caseRevision, 1) }),
    request: {
      operation: operation(r.operation),
      context: context(r.context),
      ...(r.sessionLabel === undefined &&
      masks.includes('/request/sessionLabel')
        ? {}
        : { sessionLabel: string(r.sessionLabel, 120) }),
    },
    ...(v.endpointLabel === undefined && masks.includes('/endpointLabel')
      ? {}
      : { endpointLabel: string(v.endpointLabel) }),
    authentication: {
      state,
      ...(a.userId === undefined ? {} : { userId: a.userId }),
      observedAt: number(a.observedAt),
      provenance: string(a.provenance),
    },
    semantics: string(v.semantics),
    outcome: string(v.outcome),
    completion: {
      result: boolean(c.result),
      writes: boolean(c.writes),
      ready: boolean(c.ready),
    },
    evidence: {
      data,
      completePaths: pointers(e.completePaths),
      redactedPaths: [
        ...new Set([
          ...pointers(e.redactedPaths),
          ...masks
            .filter(
              path =>
                path === '/evidence/data' || path.startsWith('/evidence/data/'),
            )
            .map(path => path.slice('/evidence/data'.length)),
        ]),
      ],
      truncated: boolean(e.truncated),
      documentBaseline: oneOf(e.documentBaseline, ['known', 'unknown']),
      ...(e.boundary === undefined
        ? {}
        : { boundary: oneOf(e.boundary, ['readiness', 'manual'] as const) }),
      outcome: oneOf(e.outcome, ['pending', 'success', 'error', 'unknown']),
    },
    timing: {
      startedAt: number(t.startedAt),
      ...(t.responseMs === undefined
        ? {}
        : { responseMs: number(t.responseMs) }),
      ...(t.completedMs === undefined
        ? {}
        : { completedMs: number(t.completedMs) }),
    },
    incompleteReasons: strings(v.incompleteReasons),
    redactedPaths: pointers(v.redactedPaths),
  }
}
export const parseImport = (text: string): PlaygroundFile => {
  if (serializedBytes(text) > PLAYGROUND_LIMITS.importBytes)
    throw new TypeError('Import exceeds 10 MiB limit.')
  const input: unknown = JSON.parse(text)
  validateValue(input)
  const v = object(input, [
    'format',
    'version',
    'exportedAt',
    'cases',
    'snapshots',
  ])
  if (v.format !== PLAYGROUND_FILE_FORMAT)
    throw new TypeError('Unknown file format.')
  const cases = array(v.cases),
    snapshots = array(v.snapshots)
  if (cases.length + snapshots.length > PLAYGROUND_LIMITS.importRecords)
    throw new TypeError('Import exceeds record limit.')
  if (
    cases.length > PLAYGROUND_LIMITS.savedCases ||
    snapshots.length > PLAYGROUND_LIMITS.savedSnapshots
  )
    throw new TypeError('Import exceeds saved record quota.')
  const file: PlaygroundFile = {
    format: PLAYGROUND_FILE_FORMAT,
    version: version(v.version),
    exportedAt: number(v.exportedAt),
    cases: cases.map((item, index) => {
      try {
        return parseCase(item)
      } catch (error) {
        throw new TypeError(
          `Case ${index + 1}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }),
    snapshots: snapshots.map((item, index) => {
      try {
        return parseSnapshot(item)
      } catch (error) {
        throw new TypeError(
          `Snapshot ${index + 1}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }),
  }
  const ids = [...file.cases, ...file.snapshots].map(item => item.id)
  if (new Set(ids).size !== ids.length)
    throw new TypeError('Duplicate record IDs.')
  return file
}

/**
 * Mandatory standard authentication masks complement ownership-based exclusion
 * of internal reuse traffic. Arbitrary application secrets still require review.
 */
const credentialValuePaths = (
  value: EncodedValue,
  prefix: string,
): string[] => {
  const paths: string[] = []
  const visit = (current: EncodedValue, path: string): void => {
    if (current === null || typeof current !== 'object') return
    for (const [key, item] of Object.entries(current)) {
      const next = `${path}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`
      if (CREDENTIAL_FIELDS.has(key)) paths.push(next)
      else visit(item, next)
    }
  }
  visit(value, prefix)
  return paths
}
export const credentialPaths = (
  op: Operation,
  prefix = '/operation',
): string[] => {
  if (op.kind !== 'method' || !AUTHENTICATION_METHODS.has(op.name)) return []
  return credentialValuePaths(op.parameters, `${prefix}/parameters`)
}
/**
 * Returns the complete file for explicit review; this function neither downloads
 * nor writes storage. Source records remain untouched and array slots stay fixed.
 */
export const previewExport = (
  cases: SavedCase[],
  snapshots: SavedSnapshot[],
  masks: Record<string, string[]>,
  exportedAt = Date.now(),
): PlaygroundFile => {
  const sanitize = <T extends SavedCase | SavedSnapshot>(
    record: T,
    mandatory: string[],
    parser: (value: unknown) => T,
  ): T => {
    const paths = [
      ...new Set([
        ...record.redactedPaths,
        ...(masks[record.id] ?? []),
        ...mandatory,
      ]),
    ]
    const encoded: unknown = structuredClone(record)
    validateValue(encoded)
    const redaction = redactValue(encoded, paths)
    if (
      redaction.value === null ||
      typeof redaction.value !== 'object' ||
      Array.isArray(redaction.value)
    )
      throw new TypeError('Record metadata cannot be redacted.')
    const value = { ...redaction.value, redactedPaths: paths }
    return parser(value)
  }
  return {
    format: PLAYGROUND_FILE_FORMAT,
    version: 1,
    exportedAt,
    cases: cases.map(item => {
      const mandatory = credentialPaths(item.operation)
      if (
        item.matrix &&
        item.operation.kind === 'method' &&
        AUTHENTICATION_METHODS.has(item.operation.name)
      ) {
        for (const [changeIndex, change] of item.matrix.changes.entries()) {
          if (
            parsePointer(change.path).some(key => CREDENTIAL_FIELDS.has(key))
          ) {
            mandatory.push('/matrix')
            break
          }
          for (const [
            candidateIndex,
            candidate,
          ] of change.candidates.entries()) {
            if ('value' in candidate)
              mandatory.push(
                ...credentialValuePaths(
                  candidate.value,
                  `/matrix/changes/${changeIndex}/candidates/${candidateIndex}/value`,
                ),
              )
          }
        }
      }
      return sanitize(item, mandatory, parseCase)
    }),
    snapshots: snapshots.map(item =>
      sanitize(
        item,
        [
          ...credentialPaths(item.request.operation, '/request/operation'),
          ...(item.request.operation.kind === 'method' &&
          AUTHENTICATION_METHODS.has(item.request.operation.name)
            ? credentialValuePaths(item.evidence.data, '/evidence/data')
            : []),
        ],
        parseSnapshot,
      ),
    ),
  }
}
/**
 * Fresh IDs avoid overwriting existing evidence. Only references within this file
 * are remapped; snapshots without an imported case retain no local case link.
 */
export const remapImport = (file: PlaygroundFile): PlaygroundFile => {
  const checkedFile = parseImport(JSON.stringify(file))
  const links = new Map(
    checkedFile.cases.map(item => [item.id, crypto.randomUUID()]),
  )
  return {
    ...checkedFile,
    cases: checkedFile.cases.map(item => ({
      ...item,
      id: links.get(item.id)!,
    })),
    snapshots: checkedFile.snapshots.map(item => {
      const { caseId, caseRevision, ...rest } = item
      const mapped = caseId === undefined ? undefined : links.get(caseId)
      return {
        ...rest,
        id: crypto.randomUUID(),
        ...(mapped === undefined
          ? {}
          : { caseId: mapped, caseRevision: caseRevision! }),
      }
    }),
  }
}

import { parsePointer, readPointer } from './Pointer'
import { canonicalValue, validateValue, type EncodedValue } from './Values'

export interface EvidenceSnapshot {
  data: Record<string, EncodedValue>
  /**
   * Complete observed subtrees, expressed against the normalized evidence root.
   * A field may be complete even if its containing capture was truncated.
   */
  completePaths: string[]
  redactedPaths: string[]
  truncated: boolean
  documentBaseline: 'known' | 'unknown'
  boundary?: 'readiness' | 'manual'
  outcome: 'pending' | 'success' | 'error' | 'unknown'
}

export type Expectation =
  | { kind: 'outcome'; outcome: 'success' | 'error' }
  | { kind: 'error-code'; code: string | number }
  | { kind: 'equals'; path: string; value: EncodedValue }
  | { kind: 'exists' | 'absent'; path: string }
  | { kind: 'number-bounds'; path: string; min?: number; max?: number }
  | {
      kind: 'document-count'
      collection: string
      boundary: 'readiness' | 'manual'
      min?: number
      max?: number
    }

export interface ExpectationResult {
  status: 'passed' | 'failed' | 'not-evaluated' | 'inconclusive'
  reason: string
  path?: string
}

const escapeKey = (key: string): string =>
  key.replaceAll('~', '~0').replaceAll('/', '~1')
const covers = (ancestor: string, path: string): boolean =>
  ancestor === '' || ancestor === path || path.startsWith(`${ancestor}/`)
const overlaps = (left: string, right: string): boolean =>
  covers(left, right) || covers(right, left)
const lookup = (data: EncodedValue, path: string): EncodedValue | undefined => {
  parsePointer(path)
  try {
    return readPointer(data, path)
  } catch {
    return undefined
  }
}
/**
 * Internal paths are constructed from validated own data keys. Captured keys
 * named constructor or __proto__ must remain comparable data; user-authored
 * pointers still pass through the stricter public pointer parser.
 */
const lookupOwn = (
  data: EncodedValue,
  path: string,
): EncodedValue | undefined => {
  let value: EncodedValue = data
  if (path === '') return value
  for (const segment of path.slice(1).split('/')) {
    const key = segment.replaceAll('~1', '/').replaceAll('~0', '~')
    if (
      value === null ||
      typeof value !== 'object' ||
      !Object.hasOwn(value, key)
    )
      return undefined
    value = Array.isArray(value) ? value[Number(key)]! : value[key]!
  }
  return value
}
const container = (value: EncodedValue | undefined): boolean =>
  value !== null && typeof value === 'object'
const redacted = (snapshot: EvidenceSnapshot, path: string): boolean =>
  snapshot.redactedPaths.some(mask => overlaps(mask, path))

const complete = (snapshot: EvidenceSnapshot, path: string): boolean => {
  if (redacted(snapshot, path)) return false
  if (!snapshot.completePaths.some(known => covers(known, path))) return false
  const isContainer = container(lookupOwn(snapshot.data, path))
  if (
    snapshot.documentBaseline === 'unknown' &&
    (path === '' ||
      (covers('/documents', path) &&
        isContainer &&
        !snapshot.completePaths.some(
          known => known.startsWith('/documents/') && covers(known, path),
        )))
  )
    return false
  if (
    snapshot.truncated &&
    isContainer &&
    (path === '' ||
      !snapshot.completePaths.some(
        known => known !== '' && covers(known, path),
      ))
  )
    return false
  return true
}

const validateBounds = (min?: number, max?: number): void => {
  if (
    (min !== undefined && !Number.isFinite(min)) ||
    (max !== undefined && !Number.isFinite(max)) ||
    (min !== undefined && max !== undefined && min > max)
  ) {
    throw new TypeError('Expected finite, ordered inclusive bounds.')
  }
  if (min === undefined && max === undefined)
    throw new TypeError('At least one bound is required.')
}
const within = (value: number, min?: number, max?: number): boolean =>
  (min === undefined || value >= min) && (max === undefined || value <= max)

/**
 * Evaluates observations without promoting missing or redacted data to facts.
 * Response success is independent from assertion success and is never a verdict
 * on application authorization.
 */
export const evaluateExpectation = (
  snapshot: EvidenceSnapshot,
  expectation: Expectation,
): ExpectationResult => {
  validateValue(snapshot.data)
  if (expectation.kind === 'equals') validateValue(expectation.value)
  const answer = (
    status: ExpectationResult['status'],
    reason: string,
    path?: string,
  ): ExpectationResult => ({ status, reason, path })
  if ('path' in expectation) parsePointer(expectation.path)
  if (
    expectation.kind === 'number-bounds' ||
    expectation.kind === 'document-count'
  )
    validateBounds(expectation.min, expectation.max)
  if (snapshot.outcome === 'pending')
    return answer(
      'not-evaluated',
      'The operation has not produced a final observation.',
    )
  if (expectation.kind === 'outcome') {
    if (snapshot.outcome === 'unknown')
      return answer('inconclusive', 'The server outcome is unknown.')
    return answer(
      snapshot.outcome === expectation.outcome ? 'passed' : 'failed',
      `Observed server outcome: ${snapshot.outcome}.`,
    )
  }
  if (expectation.kind === 'document-count') {
    const path = `/documents/${escapeKey(expectation.collection)}`
    parsePointer(path)
    if (snapshot.boundary !== expectation.boundary)
      return answer(
        'not-evaluated',
        'The requested snapshot boundary was not captured.',
        path,
      )
    const value = lookup(snapshot.data, path)
    const documents = lookup(snapshot.data, '/documents')
    if (
      !container(documents) ||
      Array.isArray(documents) ||
      snapshot.truncated ||
      snapshot.documentBaseline === 'unknown' ||
      !complete(snapshot, value === undefined ? '/documents' : path) ||
      redacted(snapshot, path)
    )
      return answer(
        'inconclusive',
        'The collection baseline or capture is incomplete.',
        path,
      )
    if (
      value !== undefined &&
      (value === null || typeof value !== 'object' || Array.isArray(value))
    )
      return answer(
        'inconclusive',
        'The collection is not an observed document map.',
        path,
      )
    const count =
      value === undefined
        ? 0
        : Object.keys(value as Record<string, EncodedValue>).length
    return answer(
      within(count, expectation.min, expectation.max) ? 'passed' : 'failed',
      `Observed ${count} unique wire IDs at ${expectation.boundary}.`,
      path,
    )
  }
  const path =
    expectation.kind === 'error-code' ? '/error/error' : expectation.path
  const value = lookup(snapshot.data, path)
  if (redacted(snapshot, path))
    return answer('inconclusive', 'The requested evidence is redacted.', path)
  if (value === undefined) {
    const segments = parsePointer(path)
    segments.pop()
    const parent =
      segments.length === 0
        ? ''
        : `/${segments.map(key => escapeKey(key)).join('/')}`
    if (!complete(snapshot, parent))
      return answer(
        'inconclusive',
        'Uncaptured evidence cannot prove absence.',
        path,
      )
    return answer(
      expectation.kind === 'absent' ? 'passed' : 'failed',
      'The path is absent from complete evidence.',
      path,
    )
  }
  if (!complete(snapshot, path))
    return answer('inconclusive', 'The requested evidence is incomplete.', path)
  switch (expectation.kind) {
    case 'exists': {
      return answer('passed', 'The path is present.', path)
    }
    case 'absent': {
      return answer('failed', 'The path is present.', path)
    }
    case 'equals': {
      return answer(
        canonicalValue(value) === canonicalValue(expectation.value)
          ? 'passed'
          : 'failed',
        'Compared exact encoded EJSON values.',
        path,
      )
    }
    case 'error-code': {
      return answer(
        canonicalValue(value) === canonicalValue(expectation.code)
          ? 'passed'
          : 'failed',
        'Compared the exact server error code.',
        path,
      )
    }
    case 'number-bounds': {
      return answer(
        typeof value === 'number' &&
          within(value, expectation.min, expectation.max)
          ? 'passed'
          : 'failed',
        'Compared inclusive numeric bounds.',
        path,
      )
    }
  }
}

/**
 * Redaction preserves positional meaning: array slots become null and remain
 * unknown through the accompanying pointer masks; object fields are removed.
 */
export const redactValue = (
  value: EncodedValue,
  paths: string[],
): { value: EncodedValue; redactedPaths: string[] } => {
  let copy = JSON.parse(canonicalValue(value)) as EncodedValue
  const masks = [...new Set(paths)]
  for (const path of masks) parsePointer(path)
  for (const path of masks.toSorted(
    (left, right) => left.length - right.length,
  )) {
    if (path === '') {
      copy = null
      continue
    }
    const keys = parsePointer(path)
    const key = keys.pop()!
    const parentPath =
      keys.length === 0 ? '' : `/${keys.map(key => escapeKey(key)).join('/')}`
    const parent = lookup(copy, parentPath)
    if (
      parent === null ||
      typeof parent !== 'object' ||
      !Object.hasOwn(parent, key)
    )
      continue
    if (Array.isArray(parent)) {
      if (!/^(0|[1-9]\d*)$/.test(key))
        throw new TypeError('Invalid array index.')
      parent[Number(key)] = null
    } else delete parent[key]
  }
  return { value: copy, redactedPaths: masks }
}

export interface EvidenceDifference {
  path: string
  kind: 'changed' | 'added' | 'removed' | 'unknown'
  left?: EncodedValue
  right?: EncodedValue
}
export interface EvidenceComparison {
  status: 'equal' | 'different' | 'inconclusive'
  differences: EvidenceDifference[]
  excludedPaths: string[]
  excludedCount: number
}

/**
 * Joins object fields (including collection wire IDs) and array positions while
 * retaining missing/null/type distinctions. Exclusions never rewrite snapshots.
 */
export const compareEvidence = (
  left: EvidenceSnapshot,
  right: EvidenceSnapshot,
  exclusions: string[] = [],
): EvidenceComparison => {
  validateValue(left.data)
  validateValue(right.data)
  const excludedPaths = [...new Set(exclusions)]
  for (const path of excludedPaths) parsePointer(path)
  const differences: EvidenceDifference[] = []
  const excluded = new Set<string>()
  const visit = (
    path: string,
    a: EncodedValue | undefined,
    b: EncodedValue | undefined,
  ): void => {
    const exclusion = excludedPaths.find(item => covers(item, path))
    if (exclusion !== undefined) {
      excluded.add(exclusion)
      return
    }
    if (
      left.redactedPaths.some(mask => covers(mask, path)) ||
      right.redactedPaths.some(mask => covers(mask, path))
    ) {
      differences.push({ path, kind: 'unknown' })
      return
    }
    if (container(a) && container(b) && Array.isArray(a) === Array.isArray(b)) {
      const keys = new Set([...Object.keys(a!), ...Object.keys(b!)])
      for (const key of [...keys].toSorted()) {
        const next = `${path}/${escapeKey(key)}`
        visit(next, lookupOwn(left.data, next), lookupOwn(right.data, next))
      }
      if (keys.size === 0 && (!complete(left, path) || !complete(right, path)))
        differences.push({ path, kind: 'unknown' })
      return
    }
    const parent = path.slice(0, path.lastIndexOf('/'))
    if (
      !complete(left, a === undefined ? parent : path) ||
      !complete(right, b === undefined ? parent : path)
    ) {
      differences.push({ path, kind: 'unknown', left: a, right: b })
      return
    }
    if (a === undefined && b === undefined) return
    if (a === undefined) differences.push({ path, kind: 'added', right: b })
    else if (b === undefined)
      differences.push({ path, kind: 'removed', left: a })
    else if (canonicalValue(a) !== canonicalValue(b))
      differences.push({ path, kind: 'changed', left: a, right: b })
  }
  visit('', left.data, right.data)
  const unknown =
    differences.some(item => item.kind === 'unknown') ||
    !complete(left, '') ||
    !complete(right, '')
  let status: EvidenceComparison['status'] =
    differences.length > 0 ? 'different' : 'equal'
  if (unknown) status = 'inconclusive'
  return {
    status,
    differences,
    excludedPaths,
    excludedCount: excluded.size,
  }
}

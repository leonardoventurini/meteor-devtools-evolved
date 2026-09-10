import type { Expectation } from './Evidence'
import type { MatrixCandidate } from './Matrix'
import { validateValue } from './Values'

export const EXPECTATION_KINDS = [
  'outcome',
  'error-code',
  'equals',
  'exists',
  'absent',
  'number-bounds',
  'document-count',
] as const satisfies readonly Expectation['kind'][]

export const MATRIX_CANDIDATE_KINDS = [
  'value',
  'alternate-id',
  'null',
  'missing',
  'wrong-type',
  'numeric-boundary',
  'string-boundary',
] as const satisfies readonly MatrixCandidate['kind'][]

export type ExpectationKind = (typeof EXPECTATION_KINDS)[number]
export type MatrixCandidateKind = (typeof MATRIX_CANDIDATE_KINDS)[number]
export type MaskMap = Record<string, string[]>

export const createExpectation = (kind: ExpectationKind): Expectation => {
  switch (kind) {
    case 'outcome': {
      return { kind, outcome: 'success' }
    }
    case 'error-code': {
      return { kind, code: 'not-authorized' }
    }
    case 'equals': {
      return { kind, path: '/result', value: null }
    }
    case 'exists':
    case 'absent': {
      return { kind, path: '/result' }
    }
    case 'number-bounds': {
      return { kind, path: '/result', min: 0 }
    }
    case 'document-count': {
      return { kind, collection: 'items', boundary: 'readiness', min: 0 }
    }
  }
}

export const createMatrixCandidate = (
  kind: MatrixCandidateKind,
): MatrixCandidate => {
  switch (kind) {
    case 'value': {
      return { kind, value: 1 }
    }
    case 'alternate-id': {
      return { kind, value: 'another-test-id' }
    }
    case 'numeric-boundary': {
      return { kind, boundary: 100 }
    }
    case 'string-boundary': {
      return { kind, length: 8 }
    }
    case 'null':
    case 'missing':
    case 'wrong-type': {
      return { kind }
    }
  }
}

export const stringifyEditorValue = (value: unknown): string =>
  JSON.stringify(value, null, 2)

/**
 * Transfer-mask JSON is untrusted editor input. Keep validation at this seam so
 * guided and raw authoring use the same data-only contract before record masks
 * reach the stricter pointer-aware export validator.
 */
export const parseMaskMap = (text: string): MaskMap => {
  const value: unknown = JSON.parse(text)

  validateValue(value)
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('Masks must map record IDs to arrays of JSON Pointers.')

  const entries = Object.entries(value).map(([recordId, paths]) => {
    if (!Array.isArray(paths) || paths.some(path => typeof path !== 'string'))
      throw new TypeError(
        'Masks must map record IDs to arrays of JSON Pointers.',
      )

    const normalizedPaths = [...new Set(paths as string[])]

    return [recordId, normalizedPaths] as const
  })

  return Object.fromEntries(entries)
}

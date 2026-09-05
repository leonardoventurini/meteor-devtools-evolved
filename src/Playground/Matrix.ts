import { PLAYGROUND_LIMITS } from './Limits'
import { readPointer, replacePointer } from './Pointer'
import { type EncodedValue, canonicalValue, parseParameters } from './Values'

export type MatrixCandidate =
  | { kind: 'value' | 'alternate-id'; value: EncodedValue }
  | { kind: 'null' | 'missing' | 'wrong-type' }
  | { kind: 'numeric-boundary'; boundary: number }
  | { kind: 'string-boundary'; length: number }

export interface MatrixDefinition {
  includeBaseline: boolean
  changes: { path: string; candidates: MatrixCandidate[] }[]
}

export interface MatrixVariant {
  label: string
  path?: string
  parameters: EncodedValue[]
  baseline: boolean
}

const valueType = (value: EncodedValue): string => {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

const candidateValues = (
  candidate: Exclude<MatrixCandidate, { kind: 'missing' }>,
  original: EncodedValue,
): EncodedValue[] => {
  switch (candidate.kind) {
    case 'value':
    case 'alternate-id': {
      return [candidate.value]
    }
    case 'null': {
      return [null]
    }
    case 'wrong-type': {
      return ['', 0, false, [], {}].filter(
        value => valueType(value) !== valueType(original),
      )
    }
    case 'numeric-boundary': {
      const values = [-1, 0, 1].map(offset => candidate.boundary + offset)
      if (!values.every(value => Number.isFinite(value)))
        throw new TypeError('Expected a finite numeric boundary.')
      return values
    }
    case 'string-boundary': {
      if (
        !Number.isSafeInteger(candidate.length) ||
        candidate.length < 0 ||
        candidate.length >= PLAYGROUND_LIMITS.requestBytes - 4
      ) {
        throw new TypeError(
          'String boundary exceeds the request limit or is invalid.',
        )
      }
      return [-1, 0, 1].map(offset =>
        'a'.repeat(Math.max(0, candidate.length + offset)),
      )
    }
    default: {
      throw new TypeError('Unknown matrix candidate.')
    }
  }
}

/**
 * Builds the full reviewable plan before execution. Each variant starts from the
 * same baseline, with canonical deduplication and request limits applied to the
 * actual arguments. No implicit Cartesian expansion or silent truncation occurs.
 */
export const generateMatrix = (
  parameters: EncodedValue[],
  definition: MatrixDefinition,
): MatrixVariant[] => {
  const baseline = parseParameters(canonicalValue(parameters))
  const variants: MatrixVariant[] = []
  const seen = new Set<string>()
  const append = (value: EncodedValue, label: string, path?: string): void => {
    const encoded = canonicalValue(value)
    if (seen.has(encoded)) return
    const effective = parseParameters(encoded)
    if (variants.length >= PLAYGROUND_LIMITS.matrixVariants) {
      throw new TypeError(
        'Matrix exceeds the 20 variant limit including baseline.',
      )
    }
    seen.add(encoded)
    variants.push({
      label,
      path,
      parameters: effective,
      baseline: path === undefined,
    })
  }

  if (definition.includeBaseline) append(baseline, 'Baseline')
  for (const change of definition.changes) {
    if (change.path === '')
      throw new TypeError('A non-root pointer is required.')
    const original = readPointer(baseline, change.path)
    for (const candidate of change.candidates) {
      if (candidate.kind === 'missing') {
        append(
          replacePointer(baseline, change.path, { kind: 'remove' }),
          `${change.path}: missing`,
          change.path,
        )
      } else {
        for (const value of candidateValues(candidate, original)) {
          append(
            replacePointer(baseline, change.path, { kind: 'replace', value }),
            `${change.path}: ${candidate.kind} = ${canonicalValue(value)}`,
            change.path,
          )
        }
      }
    }
  }
  return variants
}

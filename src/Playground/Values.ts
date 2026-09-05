import { PLAYGROUND_LIMITS } from './Limits'

/**
 * Encoded EJSON stays JSON throughout the extension. Only the inspected runtime
 * decodes custom types, using its own registrations. This avoids erasing types
 * or running user-defined decoders while inspecting, comparing, or importing.
 */
export type EncodedValue =
  | null
  | boolean
  | number
  | string
  | EncodedValue[]
  | { [key: string]: EncodedValue }

const utf8 = new TextEncoder()

export const serializedBytes = (text: string): number =>
  utf8.encode(text).byteLength

/**
 * Validates structured input without reading getters. Bounds cover the full
 * traversal, including repeated references; cycles and sparse arrays are not
 * encoded JSON. Values named __proto__ remain data, never assignment targets.
 */
export function validateValue(value: unknown): asserts value is EncodedValue {
  const ancestors = new Set<object>()
  let count = 0

  const visit = (current: unknown, depth: number): void => {
    count += 1
    if (count > PLAYGROUND_LIMITS.valueCount) {
      throw new TypeError('Maximum encoded value count exceeded.')
    }
    if (depth > PLAYGROUND_LIMITS.valueDepth) {
      throw new TypeError('Maximum encoded value depth exceeded.')
    }

    if (
      current === null ||
      typeof current === 'string' ||
      typeof current === 'boolean'
    )
      return

    if (typeof current === 'number' && Number.isFinite(current)) return
    if (typeof current !== 'object' || current === null) {
      throw new TypeError(
        'Expected encoded JSON values; encode EJSON types first.',
      )
    }

    const isArray = Array.isArray(current)
    const prototype: unknown = Object.getPrototypeOf(current)
    if (!isArray && prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Expected a plain encoded JSON object.')
    }
    if (ancestors.has(current)) {
      throw new TypeError('Encoded JSON cannot contain cyclic values.')
    }
    ancestors.add(current)

    const descriptors = Object.getOwnPropertyDescriptors(current)
    const keys = Reflect.ownKeys(descriptors).filter(
      key => !isArray || key !== 'length',
    )
    if (isArray && keys.length !== current.length) {
      throw new TypeError('Expected a dense encoded JSON array.')
    }

    for (const key of keys) {
      if (typeof key !== 'string') {
        throw new TypeError('Expected string keys in encoded JSON.')
      }
      if (isArray && !/^(0|[1-9]\d*)$/.test(key)) {
        throw new TypeError('Expected array indices in encoded JSON.')
      }
      const descriptor = descriptors[key]
      if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) {
        throw new TypeError('Encoded JSON requires enumerable data properties.')
      }
      visit(descriptor.value as unknown, depth + 1)
    }

    ancestors.delete(current)
  }

  visit(value, 0)
}

export const parseParameters = (text: string): EncodedValue[] => {
  if (serializedBytes(text) > PLAYGROUND_LIMITS.requestBytes) {
    throw new TypeError('Parameters exceed the 256 KiB request limit.')
  }
  let value: unknown
  try {
    value = JSON.parse(text) as unknown
  } catch {
    throw new TypeError(
      'Enter parameters as a valid JSON array containing encoded EJSON.',
    )
  }
  validateValue(value)
  if (!Array.isArray(value)) {
    throw new TypeError('Parameters must be an array.')
  }
  return value
}

/**
 * Produces stable structural equality without coercing EJSON wrappers or sorting
 * arrays. It also preserves own keys that would mutate a normal assignment target.
 */
export const canonicalValue = (value: EncodedValue): string => {
  validateValue(value)
  const encode = (current: EncodedValue): string => {
    if (current === null || typeof current !== 'object') {
      return JSON.stringify(current)
    }
    if (Array.isArray(current)) {
      return `[${current.map(item => encode(item)).join(',')}]`
    }

    return `{${Object.keys(current)
      .toSorted()
      .map(key => `${JSON.stringify(key)}:${encode(current[key]!)}`)
      .join(',')}}`
  }
  return encode(value)
}

export const valueBytes = (value: EncodedValue): number =>
  serializedBytes(canonicalValue(value))

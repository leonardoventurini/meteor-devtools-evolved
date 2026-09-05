import { type EncodedValue, canonicalValue } from './Values'

const unsafeKeys = new Set(['__proto__', 'prototype', 'constructor'])

/**
 * Parses exact JSON Pointers. Prototype-related segments are forbidden even for
 * reads, so an approved path remains safe when reused by an editing operation.
 */
export const parsePointer = (path: string): string[] => {
  if (path === '') return []
  if (!path.startsWith('/')) throw new TypeError('Expected a JSON Pointer.')
  return path
    .slice(1)
    .split('/')
    .map(segment => {
      if (/~(?:[^01]|$)/.test(segment))
        throw new TypeError('Invalid pointer escape.')
      const key = segment.replaceAll('~1', '/').replaceAll('~0', '~')
      if (unsafeKeys.has(key)) throw new TypeError('Unsafe pointer path.')
      return key
    })
}

const child = (value: EncodedValue, key: string): EncodedValue => {
  if (
    value === null ||
    typeof value !== 'object' ||
    !Object.hasOwn(value, key)
  ) {
    throw new TypeError('Pointer target does not exist.')
  }
  if (Array.isArray(value)) {
    if (!/^(0|[1-9]\d*)$/.test(key)) throw new TypeError('Invalid array index.')
    return value[Number(key)]!
  }
  return value[key]!
}

export const readPointer = (
  value: EncodedValue,
  path: string,
): EncodedValue => {
  let current = value
  for (const key of parsePointer(path)) current = child(current, key)
  return current
}

/**
 * Returns a detached tree with one existing target replaced or removed. Array
 * deletion is restricted to its final element to preserve positional meaning.
 */
export const replacePointer = (
  value: EncodedValue,
  path: string,
  change: { kind: 'replace'; value: EncodedValue } | { kind: 'remove' },
): EncodedValue => {
  const keys = parsePointer(path)
  if (keys.length === 0) throw new TypeError('A non-root pointer is required.')
  const copy = JSON.parse(canonicalValue(value)) as EncodedValue
  const key = keys.pop()!
  let parent = copy
  for (const segment of keys) parent = child(parent, segment)
  child(parent, key)
  if (parent === null || typeof parent !== 'object') {
    throw new TypeError('Pointer parent must be a container.')
  }
  if (change.kind === 'remove') {
    if (Array.isArray(parent)) {
      if (Number(key) !== parent.length - 1) {
        throw new TypeError(
          'Only trailing positional arguments can be removed.',
        )
      }
      parent.pop()
    } else {
      delete parent[key]
    }
  } else {
    const replacement = JSON.parse(canonicalValue(change.value)) as EncodedValue
    if (Array.isArray(parent)) parent[Number(key)] = replacement
    else parent[key] = replacement
  }
  return copy
}

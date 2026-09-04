import { describe, expect, it } from 'vitest'
import {
  findConnectionByPrefix,
  getAdjacentConnectionId,
  resolveActiveConnectionId,
} from '../src/Pages/Panel/ConnectionSelectorModel'

const connections: ConnectionSummary[] = [
  { id: 'default', displayName: 'Default connection' },
  { id: 'staging', displayName: 'Staging' },
  { id: 'production', displayName: 'Production' },
]

describe('connection selector model', () => {
  it('preserves a valid selection and falls back to the first connection', () => {
    expect(resolveActiveConnectionId(connections, 'staging')).toBe('staging')
    expect(resolveActiveConnectionId(connections, 'missing')).toBe('default')
    expect(resolveActiveConnectionId([], 'missing')).toBeUndefined()
  })

  it('moves through connections with wraparound', () => {
    expect(getAdjacentConnectionId(connections, 'default', 1)).toBe('staging')
    expect(getAdjacentConnectionId(connections, 'default', -1)).toBe(
      'production',
    )
    expect(getAdjacentConnectionId(connections, 'production', 1)).toBe(
      'default',
    )
    expect(getAdjacentConnectionId(connections, 'missing', -1)).toBe('default')
    expect(getAdjacentConnectionId([], 'default', 1)).toBeUndefined()
  })

  it('finds labels by case-insensitive prefix from the next item', () => {
    expect(findConnectionByPrefix(connections, 'default', 'p')).toBe(
      'production',
    )
    expect(findConnectionByPrefix(connections, 'production', 'st')).toBe(
      'staging',
    )
    expect(findConnectionByPrefix(connections, 'missing', 'def')).toBe(
      'default',
    )
    expect(findConnectionByPrefix(connections, 'default', 'unknown')).toBe(
      undefined,
    )
  })
})

import { describe, expect, it } from 'vitest'

import { JSONUtils } from '../../src/Utils/JSONUtils'

describe('JSONUtils', () => {
  it('serializes ordinary values', () => {
    expect(JSONUtils.stringify({ enabled: true, count: 2 })).toBe(
      '{"enabled":true,"count":2}',
    )
  })

  it('omits circular references', () => {
    const value: { name: string; self?: unknown } = { name: 'Meteor' }
    value.self = value

    expect(JSONUtils.stringify(value)).toBe('{"name":"Meteor"}')
  })
})

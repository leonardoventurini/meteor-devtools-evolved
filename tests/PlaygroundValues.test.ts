import { describe, expect, it } from 'vitest'
import {
  canonicalValue,
  parseParameters,
  validateValue,
  valueBytes,
} from '../src/Playground/Values'
import { PLAYGROUND_LIMITS } from '../src/Playground/Limits'

describe('playground encoded EJSON boundary', () => {
  it('preserves encoded types, escaping, nulls, and positional arguments', () => {
    const values = [
      { $date: 1_700_000_000_000 },
      { $binary: 'AQID' },
      { $InfNaN: 1 },
      { $escape: { $date: 'literal' } },
      { $type: 'fixture', $value: { id: 3 } },
      null,
      'last',
    ]

    expect(parseParameters(JSON.stringify(values))).toEqual(values)
    expect(parseParameters('[]')).toEqual([])
    expect(parseParameters('[null]')).not.toEqual(parseParameters('[]'))
  })

  it.each(['{}', 'null', 'undefined', '[NaN]', '[Infinity]', '[1,]'])(
    'rejects invalid parameter arrays: %s',
    text => expect(() => parseParameters(text)).toThrow(),
  )

  it('rejects executable expressions without invoking them', () => {
    expect(() => parseParameters('[(()=>{throw new Error("ran")})()]')).toThrow(
      'valid JSON',
    )
  })

  it('validates untrusted objects without invoking accessors or accepting cycles', () => {
    const accessor = Object.defineProperty({}, 'secret', {
      enumerable: true,
      get: () => {
        throw new Error('accessor invoked')
      },
    })
    const cycle: Record<string, unknown> = {}
    cycle.self = cycle

    expect(() => validateValue(accessor)).toThrow('data properties')
    expect(() => validateValue(cycle)).toThrow('cyclic')
    expect(() => validateValue(new Date())).toThrow('plain')
    expect(() => validateValue({ value: undefined })).toThrow('encoded JSON')
  })

  it('enforces generated nesting and value-count limits', () => {
    let value: unknown = null
    for (let index = 0; index <= PLAYGROUND_LIMITS.valueDepth; index++) {
      value = [value]
    }
    expect(() => validateValue(value)).toThrow('depth')
    expect(() =>
      validateValue(
        Array.from(
          { length: PLAYGROUND_LIMITS.valueCount },
          (_, index) => index,
        ),
      ),
    ).toThrow('value count')
  })

  it('measures UTF-8 and rejects oversized input before parsing', () => {
    expect(valueBytes('é')).toBe(4)
    const oversized = ' '.repeat(PLAYGROUND_LIMITS.requestBytes + 1)
    expect(() => parseParameters(oversized)).toThrow('256 KiB')
  })

  it('compares object order canonically without changing arrays or EJSON types', () => {
    expect(canonicalValue({ b: 2, a: 1 })).toBe(canonicalValue({ a: 1, b: 2 }))
    expect(canonicalValue([1, 2])).not.toBe(canonicalValue([2, 1]))
    expect(canonicalValue({ $date: 1 })).not.toBe(canonicalValue(1))
    expect(canonicalValue({ a: null })).not.toBe(canonicalValue({}))
  })

  it('preserves own special-name data without mutating prototypes', () => {
    const value = parseParameters('[{"__proto__":{"polluted":true}}]')
    expect(canonicalValue(value)).toBe('[{"__proto__":{"polluted":true}}]')
    expect(Object.hasOwn({}, 'polluted')).toBe(false)
  })
})

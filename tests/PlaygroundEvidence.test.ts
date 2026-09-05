import { describe, expect, it } from 'vitest'
import { type EncodedValue } from '../src/Playground/Values'
import { PLAYGROUND_LIMITS } from '../src/Playground/Limits'
import {
  compareEvidence,
  evaluateExpectation,
  redactValue,
  type EvidenceSnapshot,
} from '../src/Playground/Evidence'

const snapshot = (data: EvidenceSnapshot['data']): EvidenceSnapshot => ({
  data,
  completePaths: [''],
  redactedPaths: [],
  truncated: false,
  documentBaseline: 'known',
  boundary: 'readiness',
  outcome: 'success',
})

describe('evidence expectations', () => {
  it('distinguishes all four statuses and response versus assertion outcome', () => {
    const evidence = snapshot({ result: 7 })
    const expectation = { kind: 'equals' as const, path: '/result', value: 8 }
    expect(evaluateExpectation(evidence, expectation).status).toBe('failed')
    expect(
      evaluateExpectation(evidence, { ...expectation, value: 7 }).status,
    ).toBe('passed')
    expect(
      evaluateExpectation({ ...evidence, outcome: 'pending' }, expectation)
        .status,
    ).toBe('not-evaluated')
    expect(
      evaluateExpectation({ ...evidence, completePaths: [] }, expectation)
        .status,
    ).toBe('inconclusive')
  })

  it('preserves EJSON identity, null versus absent, and inclusive numeric bounds', () => {
    const evidence = snapshot({
      result: { value: null, date: { $date: 7 }, number: 3 },
    })
    expect(
      evaluateExpectation(evidence, {
        kind: 'equals',
        path: '/result/date',
        value: 7,
      }).status,
    ).toBe('failed')
    expect(
      evaluateExpectation(evidence, { kind: 'exists', path: '/result/value' })
        .status,
    ).toBe('passed')
    expect(
      evaluateExpectation(evidence, { kind: 'absent', path: '/result/missing' })
        .status,
    ).toBe('passed')
    expect(
      evaluateExpectation(evidence, {
        kind: 'number-bounds',
        path: '/result/number',
        min: 3,
        max: 3,
      }).status,
    ).toBe('passed')
  })

  it('cannot prove absence without a complete parent or use a redacted slot', () => {
    const evidence = {
      ...snapshot({ result: [null, 2] }),
      redactedPaths: ['/result/0'],
    }
    for (const kind of ['exists', 'absent'] as const) {
      expect(
        evaluateExpectation(evidence, { kind, path: '/result/0' }).status,
      ).toBe('inconclusive')
    }
    expect(
      evaluateExpectation(
        { ...snapshot({ result: {} }), completePaths: [] },
        { kind: 'absent', path: '/result/missing' },
      ).status,
    ).toBe('inconclusive')
  })

  it('allows a complete known field but not whole-result equality after truncation', () => {
    const evidence = {
      ...snapshot({ result: { known: 1 } }),
      truncated: true,
      completePaths: ['/result/known'],
    }
    expect(
      evaluateExpectation(evidence, {
        kind: 'equals',
        path: '/result',
        value: { known: 1 },
      }).status,
    ).toBe('inconclusive')
    expect(
      evaluateExpectation(evidence, {
        kind: 'equals',
        path: '/result/known',
        value: 1,
      }).status,
    ).toBe('passed')
  })

  it('requires a matching explicit snapshot boundary and known document baseline for counts', () => {
    const documents = Object.fromEntries(
      Array.from({ length: 3 }, (_, id) => [String(id), { id }]),
    )
    const evidence = snapshot({ documents: { 'a/b': documents } })
    const expectation = {
      kind: 'document-count' as const,
      collection: 'a/b',
      boundary: 'readiness' as const,
      min: 3,
      max: 3,
    }
    expect(evaluateExpectation(evidence, expectation).status).toBe('passed')
    expect(
      evaluateExpectation(
        { ...evidence, documentBaseline: 'unknown' },
        expectation,
      ).status,
    ).toBe('inconclusive')
    expect(
      evaluateExpectation({ ...evidence, truncated: true }, expectation).status,
    ).toBe('inconclusive')
    expect(
      evaluateExpectation({ ...evidence, boundary: 'manual' }, expectation)
        .status,
    ).toBe('not-evaluated')
  })

  it('counts an explicitly complete collection without requiring unrelated collections', () => {
    const evidence = {
      ...snapshot({ documents: { chosen: { one: {} }, other: {} } }),
      completePaths: ['/documents/chosen'],
    }
    expect(
      evaluateExpectation(evidence, {
        kind: 'document-count',
        collection: 'chosen',
        boundary: 'readiness',
        max: 1,
      }).status,
    ).toBe('passed')
    expect(
      evaluateExpectation(
        { ...evidence, data: {} },
        {
          kind: 'document-count',
          collection: 'chosen',
          boundary: 'readiness',
          max: 0,
        },
      ).status,
    ).toBe('inconclusive')
  })

  it('does not infer complete document objects from an unknown baseline', () => {
    const evidence = {
      ...snapshot({ documents: { collection: { id: { observed: 1 } } } }),
      documentBaseline: 'unknown' as const,
    }
    expect(
      evaluateExpectation(evidence, {
        kind: 'equals',
        path: '/documents/collection/id',
        value: { observed: 1 },
      }).status,
    ).toBe('inconclusive')
    expect(
      evaluateExpectation(evidence, {
        kind: 'equals',
        path: '/documents/collection/id/observed',
        value: 1,
      }).status,
    ).toBe('passed')
  })

  it('rejects invalid bounds instead of evaluating malformed assertions', () => {
    for (const bounds of [{}, { min: 2, max: 1 }, { min: Number.NaN }]) {
      expect(() =>
        evaluateExpectation(snapshot({ result: 1 }), {
          kind: 'number-bounds',
          path: '/result',
          ...bounds,
        }),
      ).toThrow()
    }
  })

  it('evaluates outcome independently and preserves typed error codes', () => {
    const evidence = {
      ...snapshot({ error: { error: 403 } }),
      outcome: 'error' as const,
    }
    expect(
      evaluateExpectation(evidence, { kind: 'outcome', outcome: 'error' })
        .status,
    ).toBe('passed')
    expect(
      evaluateExpectation(evidence, { kind: 'error-code', code: '403' }).status,
    ).toBe('failed')
    expect(
      evaluateExpectation(evidence, { kind: 'error-code', code: 403 }).status,
    ).toBe('passed')
  })
})

describe('redaction and structured comparison', () => {
  it('removes object properties, preserves array positions, and never changes originals', () => {
    const value = {
      args: ['secret', 'second'],
      object: { token: 'secret', okay: 1 },
    }
    const redacted = redactValue(value, ['/args/0', '/object/token'])
    expect(redacted.value).toEqual({
      args: [null, 'second'],
      object: { okay: 1 },
    })
    expect(redacted.redactedPaths).toEqual(['/args/0', '/object/token'])
    expect(value.args[0]).toBe('secret')
    expect(value.object.token).toBe('secret')
  })

  it('compares structured fields with exclusions recorded and an untouched raw view', () => {
    const left = snapshot({
      result: { stamp: 1, value: null, sequence: [1, 2] },
    })
    const right = snapshot({ result: { stamp: 2, sequence: [2, 1] } })
    const result = compareEvidence(left, right, ['/result/stamp'])
    expect(result.excludedPaths).toEqual(['/result/stamp'])
    expect(result.excludedCount).toBe(1)
    expect(result.differences.map(item => item.path)).toEqual([
      '/result/sequence/0',
      '/result/sequence/1',
      '/result/value',
    ])
    expect(compareEvidence(left, right).differences).toHaveLength(4)
  })

  it('compares own prototype-related keys as data without prototype mutation', () => {
    const left = snapshot(
      JSON.parse(
        '{"result":{"__proto__":{"polluted":1},"constructor":1}}',
      ) as EvidenceSnapshot['data'],
    )
    const right = snapshot(
      JSON.parse(
        '{"result":{"__proto__":{"polluted":2},"constructor":2}}',
      ) as EvidenceSnapshot['data'],
    )
    expect(
      compareEvidence(left, right).differences.map(item => item.path),
    ).toEqual(['/result/__proto__/polluted', '/result/constructor'])
    expect(Object.hasOwn({}, 'polluted')).toBe(false)
    expect(
      compareEvidence(snapshot({ result: [] }), snapshot({ result: {} }))
        .status,
    ).toBe('different')
  })

  it('validates encoded trees before recursive comparison and expectation traversal', () => {
    const cycle: Record<string, EncodedValue> = {}
    cycle.self = cycle
    let deep: EncodedValue = null
    for (let depth = 0; depth <= PLAYGROUND_LIMITS.valueDepth; depth++)
      deep = [deep]
    for (const value of [cycle, { result: deep }]) {
      const evidence = snapshot(value)
      expect(() => compareEvidence(evidence, snapshot({}))).toThrow()
      expect(() =>
        evaluateExpectation(evidence, { kind: 'outcome', outcome: 'success' }),
      ).toThrow()
      expect(() => redactValue(value, [])).toThrow()
    }
  })

  it('shows redacted or uncaptured evidence as unknown rather than equal', () => {
    const left = snapshot({ result: [null] })
    const result = compareEvidence(
      { ...left, redactedPaths: ['/result/0'] },
      left,
    )
    expect(result.status).toBe('inconclusive')
    expect(result.differences[0]?.kind).toBe('unknown')
    expect(compareEvidence({ ...left, completePaths: [] }, left).status).toBe(
      'inconclusive',
    )
  })

  it.each([
    '/result/__proto__',
    '/result/constructor',
    '/result/prototype',
    '/result/a~3',
  ])('rejects unsafe pointers %s', path => {
    expect(() => redactValue({ result: {} }, [path])).toThrow()
    expect(() => compareEvidence(snapshot({}), snapshot({}), [path])).toThrow()
  })
})

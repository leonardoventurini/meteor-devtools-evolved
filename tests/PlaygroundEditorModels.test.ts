import { describe, expect, it } from 'vitest'
import { parseExpectation } from '../src/Playground/Records'
import { generateMatrix } from '../src/Playground/Matrix'
import {
  EXPECTATION_KINDS,
  MATRIX_CANDIDATE_KINDS,
  createExpectation,
  createMatrixCandidate,
  parseMaskMap,
  stringifyEditorValue,
} from '../src/Playground/EditorModels'

describe('playground guided editor models', () => {
  it('creates a valid default for every expectation kind', () => {
    const expectations = EXPECTATION_KINDS.map(kind => createExpectation(kind))

    expect(expectations.map(value => parseExpectation(value))).toEqual(
      expectations,
    )
  })

  it('creates matrix candidates accepted by the existing generator', () => {
    const definition = {
      includeBaseline: true,
      changes: [
        {
          path: '/0/value',
          candidates: MATRIX_CANDIDATE_KINDS.map(kind =>
            createMatrixCandidate(kind),
          ),
        },
      ],
    }

    expect(generateMatrix([{ value: 0 }], definition)).toHaveLength(15)
  })

  it('parses and deduplicates guided transfer masks', () => {
    expect(
      parseMaskMap(
        JSON.stringify({
          snapshot: [
            '/request/operation/parameters/0',
            '/evidence/data/result',
          ],
          case: ['/operation/parameters/0'],
        }),
      ),
    ).toEqual({
      snapshot: ['/request/operation/parameters/0', '/evidence/data/result'],
      case: ['/operation/parameters/0'],
    })

    expect(() => parseMaskMap('{"snapshot":"/result"}')).toThrow(/arrays/)
  })

  it('formats guided values for the raw JSON escape hatch', () => {
    expect(
      stringifyEditorValue([{ kind: 'outcome', outcome: 'success' }]),
    ).toBe('[\n  {\n    "kind": "outcome",\n    "outcome": "success"\n  }\n]')
  })
})

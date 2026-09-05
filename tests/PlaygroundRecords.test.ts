import { describe, expect, it } from 'vitest'
import {
  parseCase,
  parseImport,
  previewExport,
  remapImport,
  type SavedCase,
} from '../src/Playground/Records'

const makeCase = (): SavedCase => ({
  id: crypto.randomUUID(),
  version: 1,
  revision: 1,
  title: 'Echo',
  createdAt: 1,
  updatedAt: 1,
  operation: { kind: 'method', name: 'echo', parameters: [{ value: 1 }, 2] },
  context: { mode: 'application', authentication: 'current' },
  notes: '',
  tags: [],
  expectations: [],
  excludedPaths: [],
  redactedPaths: [],
})
describe('saved playground records', () => {
  it('round trips generated typed cases without binding live targets', () => {
    const cases = Array.from({ length: 12 }, makeCase)
    const file = previewExport(cases, [], {}, 123)
    expect(parseImport(JSON.stringify(file)).cases).toEqual(cases)
    expect(new Set(remapImport(file).cases.map(record => record.id)).size).toBe(
      12,
    )
  })
  it('rejects unknown schema fields and future versions', () => {
    expect(() => parseCase({ ...makeCase(), connectionId: 'live' })).toThrow(
      /Unknown/,
    )
    expect(() => parseCase({ ...makeCase(), version: 2 })).toThrow(/version/)
  })
  it('keeps redacted argument indices and source records intact', () => {
    const source = makeCase()
    const file = previewExport(
      [source],
      [],
      { [source.id]: ['/operation/parameters/0'] },
      1,
    )
    expect(file.cases[0]?.operation.parameters).toEqual([null, 2])
    expect(file.cases[0]?.redactedPaths).toContain('/operation/parameters/0')
    expect(source.operation.parameters).toEqual([{ value: 1 }, 2])
    expect(parseImport(JSON.stringify(file))).toEqual(file)
  })
  it('always strips standard manually entered login secrets', () => {
    const source = makeCase()
    source.operation = {
      kind: 'method',
      name: 'login',
      parameters: [{ resume: 'secret' }],
    }
    expect(JSON.stringify(previewExport([source], [], {}, 1))).not.toContain(
      'secret',
    )
  })
  it('rejects invalid expectations, matrix pointers and duplicate IDs atomically', () => {
    expect(() =>
      parseCase({
        ...makeCase(),
        expectations: [
          { kind: 'number-bounds', path: '/result', min: 9, max: 1 },
        ],
      }),
    ).toThrow()
    expect(() =>
      parseCase({
        ...makeCase(),
        matrix: {
          includeBaseline: true,
          changes: [{ path: '/__proto__', candidates: [{ kind: 'null' }] }],
        },
      }),
    ).toThrow()
    const source = makeCase()
    expect(() =>
      parseImport(
        JSON.stringify({
          format: 'meteor-devtools-playground',
          version: 1,
          exportedAt: 1,
          cases: [source, source],
          snapshots: [],
        }),
      ),
    ).toThrow(/Duplicate/)
  })
})

import { parseSnapshot, type SavedSnapshot } from '../src/Playground/Records'
const makeSnapshot = (): SavedSnapshot => ({
  id: crypto.randomUUID(),
  version: 1,
  capturedAt: 2,
  request: {
    operation: makeCase().operation,
    context: { mode: 'isolated', authentication: 'anonymous' },
    sessionLabel: 'Account A',
  },
  endpointLabel: 'local server',
  authentication: {
    state: 'unknown',
    observedAt: 1,
    provenance: 'not exposed',
  },
  semantics: 'fresh invocation',
  outcome: 'success',
  completion: { result: true, writes: true, ready: false },
  evidence: {
    data: { result: { secret: 'hide', count: 1 } },
    completePaths: [''],
    redactedPaths: [],
    truncated: false,
    documentBaseline: 'known',
    outcome: 'success',
  },
  timing: { startedAt: 1, responseMs: 1 },
  incompleteReasons: [],
  redactedPaths: [],
})
describe('immutable snapshot format', () => {
  it('redacts labels, notes and results without changing original evidence', () => {
    const record = makeCase(),
      snapshot = makeSnapshot()
    const file = previewExport(
      [record],
      [snapshot],
      {
        [record.id]: ['/notes', '/title'],
        [snapshot.id]: [
          '/request/sessionLabel',
          '/endpointLabel',
          '/evidence/data/result/secret',
        ],
      },
      1,
    )
    expect(file.cases[0]).not.toHaveProperty('notes')
    expect(file.snapshots[0]).not.toHaveProperty('endpointLabel')
    expect(file.snapshots[0]?.evidence.redactedPaths).toEqual([
      '/result/secret',
    ])
    expect(snapshot.evidence.data).toHaveProperty('result.secret', 'hide')
    expect(parseImport(JSON.stringify(file))).toEqual(file)
  })
  it('remaps linked imported cases together and removes unavailable executable references', () => {
    const record = makeCase(),
      snapshot = { ...makeSnapshot(), caseId: record.id, caseRevision: 1 }
    const file = remapImport(previewExport([record], [snapshot], {}, 1))
    expect(file.snapshots[0]?.caseId).toBe(file.cases[0]?.id)
    expect(file.cases[0]?.id).not.toBe(record.id)
    expect(
      remapImport(previewExport([], [snapshot], {}, 1)).snapshots[0],
    ).not.toHaveProperty('caseId')
  })
  it('rejects raw internal credential fields, invalid IDs and incomplete references', () => {
    expect(() =>
      parseSnapshot({ ...makeSnapshot(), resumeToken: 'secret' }),
    ).toThrow(/Unknown/)
    expect(() =>
      parseSnapshot({ ...makeSnapshot(), caseId: crypto.randomUUID() }),
    ).toThrow(/revision/)
    expect(() => parseCase({ ...makeCase(), id: 'old-local-id' })).toThrow(
      /UUID/,
    )
  })
  it('enforces file byte and record caps before import', () => {
    expect(() => parseImport(' '.repeat(10 * 1024 * 1024 + 1))).toThrow(
      /10 MiB/,
    )
    const file = {
      format: 'meteor-devtools-playground',
      version: 1,
      exportedAt: 1,
      cases: Array.from({ length: 301 }, makeCase),
      snapshots: [],
    }
    expect(() => parseImport(JSON.stringify(file))).toThrow(/record limit/)
  })
  it('rejects unsafe nested structural fields without evaluating getters', () => {
    let reads = 0
    expect(() =>
      parseCase({
        ...makeCase(),
        get notes() {
          reads++
          return 'secret'
        },
      }),
    ).toThrow()
    expect(reads).toBe(0)
    expect(() =>
      parseCase({
        ...makeCase(),
        expectations: [
          { kind: 'equals', path: '/result', value: 1, script: 'alert(1)' },
        ],
      }),
    ).toThrow(/Unknown/)
  })
})

import { readFileSync } from 'node:fs'
it('validates the generated public format example', () => {
  const reference = readFileSync(
    new URL('../docs/ddp-playground-format.md', import.meta.url),
    'utf8',
  )
  const example = reference.match(/```json\n([\s\S]+?)\n```/)?.[1]
  expect(example).toBeDefined()
  expect(parseImport(example!).cases[0]?.operation.parameters).toEqual([
    { $date: 1_788_600_000_000 },
  ])
})
it('enforces generated document and per-table record limits', () => {
  const snapshot = makeSnapshot()
  const documents = Object.fromEntries(
    Array.from({ length: 1001 }, (_, index) => [
      String(index),
      { value: index },
    ]),
  )
  expect(() =>
    parseSnapshot({
      ...snapshot,
      evidence: {
        ...snapshot.evidence,
        data: { documents: { items: documents } },
      },
    }),
  ).toThrow(/document limit/)
  expect(() =>
    parseSnapshot({
      ...snapshot,
      evidence: { ...snapshot.evidence, data: { documents: { items: [] } } },
    }),
  ).toThrow(/wire IDs/)
  const file = {
    format: 'meteor-devtools-playground',
    version: 1,
    exportedAt: 1,
    cases: Array.from({ length: 201 }, makeCase),
    snapshots: [],
  }
  expect(() => parseImport(JSON.stringify(file))).toThrow(/quota/)
})
it('masks authentication response credentials and propagates unknown evidence', () => {
  const snapshot = makeSnapshot()
  snapshot.request.operation = {
    kind: 'method',
    name: 'login',
    parameters: [{ resume: 'request-secret' }],
  }
  snapshot.evidence.data = { result: { token: 'response-secret', id: 'user' } }
  const file = previewExport([], [snapshot], {}, 1)
  expect(JSON.stringify(file)).not.toContain('request-secret')
  expect(JSON.stringify(file)).not.toContain('response-secret')
  expect(file.snapshots[0]?.evidence.redactedPaths).toContain('/result/token')
})
it('does not retain credential matrix candidates for authentication cases', () => {
  const record = makeCase()
  record.operation = {
    kind: 'method',
    name: 'login',
    parameters: [{ resume: 'baseline-secret' }],
  }
  record.matrix = {
    includeBaseline: true,
    changes: [
      {
        path: '/0/resume',
        candidates: [{ kind: 'value', value: 'candidate-secret' }],
      },
    ],
  }
  const file = previewExport([record], [], {}, 1)
  expect(JSON.stringify(file)).not.toContain('baseline-secret')
  expect(JSON.stringify(file)).not.toContain('candidate-secret')
  expect(file.cases[0]?.redactedPaths).toContain('/matrix')
  expect(file.cases[0]).not.toHaveProperty('matrix')
})

it.each(['resetPassword', 'changePassword'])(
  'masks positional %s credentials',
  name => {
    const record = makeCase()
    record.operation = {
      kind: 'method',
      name,
      parameters: ['first-secret', { $digest: 'second-secret' }, 'unrelated'],
    }
    const file = previewExport([record], [], {}, 1)
    expect(file.cases[0]?.operation.parameters).toEqual([
      null,
      null,
      'unrelated',
    ])
    expect(JSON.stringify(file)).not.toContain('secret')
  },
)

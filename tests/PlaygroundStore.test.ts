import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlaygroundStore } from '../src/Stores/Panel/PlaygroundStore'
import type { PlaygroundCommand } from '../src/Playground/Commands'

afterEach(() => vi.useRealTimers())
const setup = () => {
  const commands: PlaygroundCommand[] = []
  const store = new PlaygroundStore()
  store.connect(command => commands.push(command))
  store.setConnections([
    { id: 'default', displayName: 'Default' },
    { id: 'second', displayName: 'Second' },
  ])
  store.handleEvent({ kind: 'hello', pageEpoch: 'page' })
  store.handleEvent({
    kind: 'session',
    pageEpoch: 'page',
    panelSessionId: store.panelSessionId,
  })
  return { store, commands }
}
describe('playground panel lifecycle and drafts', () => {
  it('opens an explicit session and renews until disposed', () => {
    vi.useFakeTimers()
    const { store, commands } = setup()
    expect(commands[0]).toMatchObject({ kind: 'open', pageEpoch: 'page' })
    vi.advanceTimersByTime(5000)
    expect(commands.at(-1)?.kind).toBe('renew')
    store.dispose()
    expect(commands.at(-1)?.kind).toBe('close')
    const count = commands.length
    vi.advanceTimersByTime(10_000)
    expect(commands).toHaveLength(count)
  })
  it('opens captures without executing and routes fresh invocations to their connection', () => {
    const { store, commands } = setup()
    store.openDraft(
      { kind: 'method', name: 'echo', parameters: [1] },
      'second',
      'page',
    )
    expect(commands.filter(command => command.kind === 'run')).toHaveLength(0)
    store.run()
    expect(commands.at(-1)).toMatchObject({
      kind: 'run',
      connectionId: 'second',
      operation: { name: 'echo', parameters: [1] },
    })
    store.dispose()
  })
  it('requires an explicit target for stale or unavailable captured connections', () => {
    const { store, commands } = setup()
    store.openDraft(
      { kind: 'method', name: 'echo', parameters: [] },
      'second',
      'old-page',
    )
    expect(() => store.run()).toThrow(/target/i)
    expect(commands.filter(command => command.kind === 'run')).toHaveLength(0)
    store.selectConnection('default')
    store.run()
    expect(commands.at(-1)).toMatchObject({ connectionId: 'default' })
    store.dispose()
  })
  it('preserves draft content across page changes while invalidating its target', () => {
    const { store } = setup()
    store.openDraft(
      { kind: 'subscription', name: 'items', parameters: [{ owner: 7 }] },
      'second',
      'page',
    )
    store.handleEvent({ kind: 'hello', pageEpoch: 'next-page' })
    expect(store.name).toBe('items')
    expect(store.parametersText).toContain('owner')
    expect(store.targetConfirmed).toBe(false)
    expect(store.sessionReady).toBe(false)
    store.dispose()
  })
  it('does not accept unrelated or malformed events', () => {
    const { store } = setup()
    store.handleEvent({
      kind: 'session',
      pageEpoch: 'page',
      panelSessionId: 'other',
    })
    store.handleEvent({ kind: 'run', record: { request: null } })
    expect(store.runs).toHaveLength(0)
    expect(store.sessionReady).toBe(true)
    store.dispose()
  })
  it('bounds and separates catalog observations without executing guessed names', () => {
    const { store, commands } = setup()
    store.observeLog({
      id: '1',
      connectionId: 'second',
      content: JSON.stringify({
        msg: 'method',
        method: 'observed',
        params: [2],
      }),
    })
    store.selectConnection('second')
    expect(store.catalogEntries[0]).toMatchObject({
      name: 'observed',
      applicationCount: 1,
    })
    expect(commands.filter(command => command.kind === 'run')).toHaveLength(0)
    store.dispose()
  })
})

import type { RunCommand } from '../src/Playground/Commands'
import type { RunRecord } from '../src/Playground/RunRecord'
import { createMethodRun } from '../src/Playground/MethodRun'
import type { PlaygroundStorage } from '../src/Stores/Panel/PlaygroundStore'
import type { SavedCase, SavedSnapshot } from '../src/Playground/Records'
const recordFor = (request: RunCommand, sequence = 1): RunRecord => ({
  request,
  sequence,
  startedAt: 1,
  updatedAt: 2,
  phase: 'settled',
  finished: true,
  endpointLabel: 'Fixture connection',
  authentication: { state: 'anonymous', observedAt: 1, provenance: 'fixture' },
  evidence: {
    data: { result: request.operation.parameters },
    outcome: 'success',
    completePaths: [''],
    redactedPaths: [],
    truncated: false,
    documentBaseline: 'known',
  },
  method: {
    ...createMethodRun(1),
    phase: 'settled',
    resultSeen: true,
    writesReflected: true,
    outcome: 'success',
  },
  reasons: [],
})
const runCommand = (commands: PlaygroundCommand[]): RunCommand => {
  const request = commands.at(-1)
  if (request?.kind !== 'run') throw new Error('Expected run.')
  return request
}
const memoryStorage = (): PlaygroundStorage => {
  const cases: SavedCase[] = [],
    snapshots: SavedSnapshot[] = []
  return {
    saveCase: async record => {
      const previous = cases.findIndex(item => item.id === record.id)
      if (previous !== -1) cases.splice(previous, 1)
      cases.push(structuredClone(record))
      return structuredClone(record)
    },
    saveSnapshot: async record => {
      snapshots.push(structuredClone(record))
      return structuredClone(record)
    },
    readCases: async () => ({ records: structuredClone(cases), errors: [] }),
    readSnapshots: async () => ({
      records: structuredClone(snapshots),
      errors: [],
    }),
    deleteCase: async id => {
      const index = cases.findIndex(item => item.id === id)
      if (index !== -1) cases.splice(index, 1)
    },
    deleteSnapshot: async id => {
      const index = snapshots.findIndex(item => item.id === id)
      if (index !== -1) snapshots.splice(index, 1)
    },
    importReviewed: vi.fn(async file => file),
  }
}
describe('playground run evidence and orchestration', () => {
  it('correlates updates, rejects malformed evidence, and preserves late evidence', () => {
    const { store, commands } = setup()
    store.setField('name', 'echo')
    store.run()
    const record = recordFor(runCommand(commands))
    store.handleEvent({ kind: 'run', record: { ...record, evidence: null } })
    expect(store.runs).toHaveLength(0)
    store.handleEvent({ kind: 'run', record })
    store.handleEvent({
      kind: 'run',
      record: { ...record, sequence: 0, endpointLabel: 'stale' },
    })
    expect(store.runs[0]?.endpointLabel).toBe('Fixture connection')
    store.handleEvent({
      kind: 'run',
      record: {
        ...record,
        sequence: 2,
        method: { ...record.method, lateEvidence: true },
      },
    })
    expect(store.runs).toHaveLength(1)
    expect(store.runs[0]?.method?.lateEvidence).toBe(true)
    store.dispose()
  })
  it('enforces three operation slots and releases rejected commands', () => {
    const { store, commands } = setup()
    store.setField('name', 'echo')
    for (let index = 0; index < 3; index++) store.run()
    expect(() => store.run()).toThrow(/Three/)
    const rejected = runCommand(commands)
    store.handleEvent({
      kind: 'error',
      panelSessionId: store.panelSessionId,
      requestId: rejected.requestId,
      message: 'Rejected',
    })
    expect(() => store.run()).not.toThrow()
    store.dispose()
  })
  it('waits for publication cleanup and evaluates retained readiness before dispatching the next variant', async () => {
    vi.useFakeTimers()
    const { store, commands } = setup()
    store.openDraft(
      { kind: 'subscription', name: 'items', parameters: [1] },
      'default',
      'page',
    )
    store.setField(
      'matrixText',
      JSON.stringify({
        includeBaseline: true,
        changes: [{ path: '/0', candidates: [{ kind: 'null' }] }],
      }),
    )
    store.setField(
      'expectationsText',
      JSON.stringify([
        {
          kind: 'document-count',
          collection: 'items',
          boundary: 'readiness',
          min: 1,
        },
      ]),
    )
    store.previewMatrix()
    const running = store.startMatrix()
    const record = recordFor(runCommand(commands))
    delete record.method
    record.phase = 'ready'
    record.finished = false
    record.readiness = {
      data: { documents: { items: { id: { value: 1 } } } },
      outcome: 'success',
      completePaths: ['/documents'],
      redactedPaths: [],
      truncated: false,
      documentBaseline: 'known',
      boundary: 'readiness',
    }
    record.evidence = record.readiness
    store.handleEvent({ kind: 'run', record })
    expect(commands.at(-1)).toMatchObject({
      kind: 'stop',
      requestId: record.request.requestId,
    })
    await vi.advanceTimersByTimeAsync(1000)
    expect(commands.filter(command => command.kind === 'run')).toHaveLength(1)
    store.handleEvent({
      kind: 'run',
      record: {
        ...record,
        sequence: 2,
        phase: 'stopped',
        finished: true,
        evidence: { ...record.evidence, boundary: 'manual' },
      },
    })
    await vi.advanceTimersByTimeAsync(250)
    expect(commands.filter(command => command.kind === 'run')).toHaveLength(2)
    store.stopMatrix()
    await running
    expect(store.matrixProgress?.outcomes[0]?.status).toBe('success')
    store.dispose()
  })
  it('interrupts queued matrix work on target changes and preserves the editor', async () => {
    vi.useFakeTimers()
    const { store, commands } = setup()
    store.setField('name', 'echo')
    store.setField('parametersText', '[1]')
    store.setField(
      'matrixText',
      JSON.stringify({
        includeBaseline: true,
        changes: [{ path: '/0', candidates: [{ kind: 'null' }] }],
      }),
    )
    store.previewMatrix()
    const running = store.startMatrix()
    store.selectConnection('second')
    await running
    await vi.advanceTimersByTimeAsync(1000)
    expect(commands.filter(command => command.kind === 'run')).toHaveLength(1)
    expect(store.matrixPreview).toHaveLength(0)
    expect(store.parametersText).toBe('[1]')
    store.dispose()
  })
  it('evicts finished history to the configured run count', () => {
    const { store, commands } = setup()
    store.setField('name', 'echo')
    for (let index = 0; index < 102; index++) {
      store.run()
      store.handleEvent({
        kind: 'run',
        record: recordFor(runCommand(commands)),
      })
    }
    expect(store.runs).toHaveLength(100)
    store.dispose()
  })
})
describe('reviewed saved playground workflows', () => {
  it('preserves immutable saved evidence and ties case revision to invocation time', async () => {
    const storage = memoryStorage()
    const commands: PlaygroundCommand[] = []
    const store = new PlaygroundStore(storage)
    store.connect(command => commands.push(command))
    store.setConnections([{ id: 'default', displayName: 'Default' }])
    store.handleEvent({ kind: 'hello', pageEpoch: 'page' })
    store.handleEvent({
      kind: 'session',
      pageEpoch: 'page',
      panelSessionId: store.panelSessionId,
    })
    store.setField('name', 'echo')
    store.setField('title', 'First case')
    await store.saveCase()
    expect(store.cases).toHaveLength(0)
    expect(store.transferKind).toBe('case')
    await store.confirmTransfer()
    store.run()
    const record = recordFor(runCommand(commands))
    store.handleEvent({ kind: 'run', record })
    store.setField('title', 'Revised case')
    await store.saveCase()
    expect(store.cases[0]?.revision).toBe(1)
    await store.confirmTransfer()
    store.previewSnapshot()
    expect(store.snapshots).toHaveLength(0)
    expect(store.transferPreview?.snapshots[0]?.caseRevision).toBe(1)
    await store.confirmTransfer()
    expect(store.snapshots).toHaveLength(1)
    expect(() =>
      store.previewExport(
        store.cases.map(item => item.id),
        store.snapshots.map(item => item.id),
      ),
    ).not.toThrow()
    expect(store.transferPreview?.cases).toHaveLength(1)
    expect(store.transferPreview?.snapshots).toHaveLength(1)
    store.cancelTransfer()
    store.handleEvent({
      kind: 'run',
      record: {
        ...record,
        sequence: 2,
        evidence: { ...record.evidence, data: { result: 'later' } },
      },
    })
    expect(store.snapshots[0]?.evidence.data.result).toEqual([])
    store.dispose()
  })
  it('compares live run evidence without passing MobX objects across validation boundaries', () => {
    const { store, commands } = setup()
    store.setField('name', 'echo')
    store.run()
    const first = recordFor(runCommand(commands))
    store.handleEvent({ kind: 'run', record: first })
    store.setField('parametersText', '[2]')
    store.run()
    const second = recordFor(runCommand(commands))
    store.handleEvent({ kind: 'run', record: second })
    store.setField('comparisonLeft', first.request.requestId)
    store.setField('comparisonRight', second.request.requestId)
    expect(store.comparison?.status).toBe('different')
    store.dispose()
  })
  it('blocks masked positional placeholders until replacements are explicitly reviewed', async () => {
    const store = new PlaygroundStore(memoryStorage())
    const send = vi.fn()
    store.connect(send)
    store.setConnections([{ id: 'default', displayName: 'Default' }])
    store.handleEvent({ kind: 'hello', pageEpoch: 'page' })
    store.handleEvent({
      kind: 'session',
      pageEpoch: 'page',
      panelSessionId: store.panelSessionId,
    })
    store.setField('name', 'echo')
    store.setField('parametersText', '["sensitive", 1]')
    store.saveCase()
    const id = store.transferPreview!.cases[0]!.id
    store.setField(
      'transferMasksText',
      JSON.stringify({ [id]: ['/operation/parameters/0'] }),
    )
    store.applyMasks()
    await store.confirmTransfer()
    store.loadCase(id)
    store.selectConnection('default')
    expect(store.parametersText).toContain('null')
    expect(() => store.run()).toThrow(/masked/i)
    store.setField('parametersText', '[null, 2]')
    expect(() => store.run()).toThrow(/masked/i)
    store.setField('parametersText', '[]')
    expect(() => store.resolveRequestMasks()).toThrow()
    expect(store.unresolvedRequestMasks).toHaveLength(1)
    store.setField('parametersText', '[null, 2]')
    store.resolveRequestMasks()
    expect(() => store.run()).not.toThrow()
    store.saveCase()
    expect(store.transferPreview?.cases[0]?.redactedPaths).not.toContain(
      '/operation/parameters/0',
    )
    store.dispose()
  })
  it('requires edited masks to be applied to the visible preview before confirmation', async () => {
    const store = new PlaygroundStore(memoryStorage())
    store.previewImport(
      JSON.stringify({
        format: 'meteor-devtools-playground',
        version: 1,
        exportedAt: 1,
        cases: [],
        snapshots: [],
      }),
    )
    store.setField('transferMasksText', '{ }')
    await expect(store.confirmTransfer()).rejects.toThrow(/Apply masks/)
    store.applyMasks()
    await expect(store.confirmTransfer()).resolves.toBeUndefined()
    store.dispose()
  })
  it('only imports after reviewing and confirming, and never executes imported records', async () => {
    const storage = memoryStorage()
    const store = new PlaygroundStore(storage)
    const send = vi.fn()
    store.connect(send)
    const file = {
      format: 'meteor-devtools-playground',
      version: 1,
      exportedAt: 1,
      cases: [],
      snapshots: [],
    }
    store.previewImport(JSON.stringify(file))
    expect(storage.importReviewed).not.toHaveBeenCalled()
    await store.confirmTransfer()
    expect(storage.importReviewed).toHaveBeenCalledOnce()
    expect(send).not.toHaveBeenCalled()
    store.dispose()
  })
})

import { makeAutoObservable, runInAction, toJS } from 'mobx'
import { PlaygroundDatabase } from '../../Database/PlaygroundDatabase'
import { EndpointCatalog } from '../../Playground/Catalog'
import {
  parseCommand,
  type ExecutionContext,
  type Operation,
  type PlaygroundCommand,
  type RunCommand,
  type SessionIdentity,
} from '../../Playground/Commands'
import {
  compareEvidence,
  evaluateExpectation,
  type Expectation,
} from '../../Playground/Evidence'
import {
  PLAYGROUND_LIMITS,
  PLAYGROUND_PROTOCOL_VERSION,
} from '../../Playground/Limits'
import {
  generateMatrix,
  type MatrixDefinition,
  type MatrixVariant,
} from '../../Playground/Matrix'
import {
  parseCase,
  parseExpectation,
  parseImport,
  previewExport,
  type PlaygroundFile,
  type SavedCase,
  type SavedSnapshot,
} from '../../Playground/Records'
import {
  MatrixScheduler,
  type MatrixOutcome,
  type MatrixSummary,
} from '../../Playground/Scheduler'
import { readPointer } from '../../Playground/Pointer'
import {
  parseParameters,
  serializedBytes,
  validateValue,
} from '../../Playground/Values'
import type { RunRecord } from '../../Playground/RunRecord'

interface PlaygroundConnection {
  id: string
  displayName: string
}
interface RunOutcome extends MatrixOutcome {
  requestId: string
}
interface PlaygroundLog {
  id: string
  connectionId: string
  content: string
  pageEpoch?: string
  timestamp?: number
  provenance?: 'application' | 'playground'
  internal?: boolean
}
export type PlaygroundStorage = Pick<
  PlaygroundDatabase,
  | 'saveCase'
  | 'saveSnapshot'
  | 'readCases'
  | 'readSnapshots'
  | 'deleteCase'
  | 'deleteSnapshot'
  | 'importReviewed'
>
const message = (error: unknown) =>
  error instanceof Error ? error.message : 'The playground operation failed.'
const parseArray = (text: string): unknown[] => {
  const value: unknown = JSON.parse(text)
  if (!Array.isArray(value)) throw new TypeError('Expected a JSON array.')
  return value
}

/**
 * Panel-owned drafts and bounded history. The injected runner owns live Meteor
 * resources; this store only sends explicit commands for the current lease.
 */
export class PlaygroundStore {
  pageEpoch = ''
  panelSessionId = ''
  sessionReady = false
  connections: PlaygroundConnection[] = []
  connectionId = 'default'
  targetConfirmed = true
  kind: Operation['kind'] = 'method'
  name = ''
  parametersText = '[]'
  mode: 'application' | 'isolated' = 'application'
  isolatedAuthentication: 'anonymous' | 'reuse' = 'anonymous'
  sessionLabel = 'Current session'
  waitMs: number = PLAYGROUND_LIMITS.waitMs
  title = ''
  notes = ''
  tagsText = ''
  expectationsText = '[]'
  excludedPathsText = '[]'
  matrixText = '{\n  "includeBaseline": true,\n  "changes": []\n}'
  matrixDelayMs: number = PLAYGROUND_LIMITS.matrixDelayMs
  continueOnError = false
  matrixPreview: MatrixVariant[] = []
  matrixProgress: MatrixSummary<RunOutcome> | undefined
  runs: RunRecord[] = []
  cases: SavedCase[] = []
  snapshots: SavedSnapshot[] = []
  selectedRunId = ''
  selectedCaseId = ''
  unresolvedRequestMasks: string[] = []
  resolvedRequestMasks: string[] = []
  comparisonLeft = ''
  comparisonRight = ''
  error = ''
  notice = ''
  storageErrors: string[] = []
  catalogRevision = 0
  transferPreview: PlaygroundFile | undefined
  transferKind: 'export' | 'import' | 'snapshot' | 'case' | undefined
  transferMasksText = '{}'
  transferMasksApplied = '{}'
  private catalog = new EndpointCatalog()
  private send: ((command: PlaygroundCommand) => void) | undefined
  private renewTimer: ReturnType<typeof setInterval> | undefined
  private scheduler: MatrixScheduler<RunOutcome>
  private pending = new Map<
    string,
    {
      resolve: (outcome: RunOutcome) => void
      subscription: boolean
      stopping: boolean
      expectations: Expectation[]
    }
  >()
  private requests = new Map<string, RunCommand>()
  private caseReferences = new Map<
    string,
    { caseId: string; caseRevision: number }
  >()
  private storage: PlaygroundStorage

  constructor(storage: PlaygroundStorage = new PlaygroundDatabase()) {
    this.storage = storage
    this.scheduler = new MatrixScheduler({
      execute: variant => this.executeMatrixVariant(variant),
      contextValid: () =>
        this.sessionReady &&
        this.targetConfirmed &&
        this.connections.some(
          connection => connection.id === this.connectionId,
        ),
      onProgress: progress => {
        runInAction(() => {
          this.matrixProgress = progress
        })
      },
    })
    makeAutoObservable<
      this,
      | 'storage'
      | 'send'
      | 'renewTimer'
      | 'scheduler'
      | 'catalog'
      | 'pending'
      | 'requests'
      | 'caseReferences'
    >(
      this,
      {
        storage: false,
        send: false,
        renewTimer: false,
        scheduler: false,
        catalog: false,
        pending: false,
        requests: false,
        caseReferences: false,
      },
      { autoBind: true },
    )
  }
  connect(send: (command: PlaygroundCommand) => void): void {
    this.send = send
  }
  private identity(): SessionIdentity {
    return {
      version: PLAYGROUND_PROTOCOL_VERSION,
      panelSessionId: this.panelSessionId,
      pageEpoch: this.pageEpoch,
    }
  }
  private command(kind: 'open' | 'renew' | 'close' | 'stop-all'): void {
    if (this.send && this.pageEpoch && this.panelSessionId)
      this.send({ ...this.identity(), kind })
  }
  dispose(): void {
    this.scheduler.stop('interrupted')
    this.command('close')
    clearInterval(this.renewTimer)
    this.renewTimer = undefined
    this.sessionReady = false
    this.send = undefined
    this.settlePending('interrupted')
  }
  private settlePending(status: MatrixOutcome['status']): void {
    for (const [requestId, pending] of this.pending)
      pending.resolve({ requestId, status })
    this.pending.clear()
  }

  handleEvent(input: unknown): void {
    if (input === null || typeof input !== 'object') return
    const event = input as Record<string, unknown>
    if (
      event.kind === 'hello' &&
      typeof event.pageEpoch === 'string' &&
      event.pageEpoch &&
      event.pageEpoch.length <= 128
    ) {
      if (event.pageEpoch === this.pageEpoch && this.panelSessionId) {
        this.command('open')
        return
      }
      this.scheduler.stop('interrupted')
      this.settlePending('interrupted')
      this.command('close')
      clearInterval(this.renewTimer)
      if (this.pageEpoch) this.targetConfirmed = false
      this.pageEpoch = event.pageEpoch
      this.panelSessionId = crypto.randomUUID()
      this.sessionReady = false
      this.catalog.clear()
      this.catalogRevision += 1
      this.runs = this.runs.map(record =>
        record.finished
          ? record
          : {
              ...record,
              finished: true,
              phase: 'interrupted',
              updatedAt: Date.now(),
              reasons: [
                ...record.reasons,
                'The inspected page changed; previous work will not resume.',
              ],
              evidence: { ...record.evidence, outcome: 'unknown' },
            },
      )
      this.requests.clear()
      this.matrixPreview = []
      this.command('open')
      this.renewTimer = setInterval(
        () => this.command('renew'),
        PLAYGROUND_LIMITS.leaseRenewMs,
      )
      return
    }
    if (
      event.kind === 'session' &&
      event.pageEpoch === this.pageEpoch &&
      event.panelSessionId === this.panelSessionId
    ) {
      this.sessionReady = true
      return
    }
    if (
      event.kind === 'error' &&
      (event.panelSessionId === undefined ||
        event.panelSessionId === this.panelSessionId) &&
      typeof event.message === 'string'
    ) {
      this.error = event.message
      if (typeof event.requestId === 'string') {
        this.pending
          .get(event.requestId)
          ?.resolve({ requestId: event.requestId, status: 'interrupted' })
        this.pending.delete(event.requestId)
        this.requests.delete(event.requestId)
      }
      return
    }
    if (
      event.kind !== 'run' ||
      !event.record ||
      typeof event.record !== 'object'
    )
      return
    const record = event.record as RunRecord
    if (
      !record.request ||
      record.request.pageEpoch !== this.pageEpoch ||
      record.request.panelSessionId !== this.panelSessionId ||
      !this.requests.has(record.request.requestId) ||
      !Number.isInteger(record.sequence)
    )
      return
    const previous = this.runs.find(
      item => item.request.requestId === record.request.requestId,
    )
    if (previous && previous.sequence >= record.sequence) return
    try {
      validateValue(record)
      if (
        !record.evidence ||
        !Array.isArray(record.evidence.completePaths) ||
        !Array.isArray(record.evidence.redactedPaths) ||
        !record.evidence.data ||
        typeof record.evidence.data !== 'object' ||
        typeof record.evidence.truncated !== 'boolean' ||
        typeof record.finished !== 'boolean' ||
        !Array.isArray(record.reasons) ||
        record.reasons.some(reason => typeof reason !== 'string') ||
        !record.authentication ||
        !Number.isFinite(record.startedAt) ||
        !Number.isFinite(record.updatedAt) ||
        typeof record.endpointLabel !== 'string' ||
        serializedBytes(JSON.stringify(record)) > PLAYGROUND_LIMITS.runBytes ||
        JSON.stringify(record.request) !==
          JSON.stringify(this.requests.get(record.request.requestId))
      )
        return
    } catch {
      return
    }
    this.runs = [
      structuredClone(record),
      ...this.runs.filter(
        item => item.request.requestId !== record.request.requestId,
      ),
    ]
    this.trimHistory()
    const pending = this.pending.get(record.request.requestId)
    if (
      pending?.subscription &&
      record.evidence.boundary === 'readiness' &&
      !pending.stopping &&
      !record.finished
    ) {
      pending.stopping = true
      this.stop(record.request.requestId)
    }
    if (pending && record.finished) {
      const evidence = pending.subscription
        ? (record.readiness ?? record.evidence)
        : record.evidence
      const results = pending.expectations.map(expectation =>
        evaluateExpectation(evidence, expectation),
      )
      let status: MatrixOutcome['status'] =
        evidence.outcome === 'error' ? 'error' : 'success'
      if (record.phase === 'timed-out') status = 'timeout'
      else if (record.phase === 'interrupted' || record.phase === 'local-error')
        status = 'interrupted'
      else if (record.evidence.truncated) status = 'limit-exceeded'
      else if (record.phase === 'stopped' && !pending.stopping)
        status = 'stopped'
      else if (results.some(result => result.status === 'failed'))
        status = 'assertion-failed'
      else if (
        (evidence.outcome !== 'success' && evidence.outcome !== 'error') ||
        results.some(result => result.status === 'inconclusive')
      )
        status = 'inconclusive'
      pending.resolve({ requestId: record.request.requestId, status })
      this.pending.delete(record.request.requestId)
    }
  }
  private trimHistory(): void {
    let bytes = this.runs.reduce(
      (sum, record) => sum + serializedBytes(JSON.stringify(record)),
      0,
    )
    while (
      this.runs.length > PLAYGROUND_LIMITS.historyRuns ||
      bytes > PLAYGROUND_LIMITS.historyBytes
    ) {
      const index = this.runs.findLastIndex(record => record.finished)
      if (index === -1) break
      const removed = this.runs.splice(index, 1)[0]
      if (removed) {
        bytes -= serializedBytes(JSON.stringify(removed))
        this.requests.delete(removed.request.requestId)
        this.caseReferences.delete(removed.request.requestId)
      }
    }
  }
  setConnections(connections: PlaygroundConnection[]): void {
    this.connections = connections.map(connection => ({ ...connection }))
    if (!connections.some(connection => connection.id === this.connectionId)) {
      this.targetConfirmed = false
      this.scheduler.stop('interrupted')
      this.matrixPreview = []
    }
  }
  selectConnection(id: string): void {
    if (!this.connections.some(connection => connection.id === id))
      throw new TypeError('Select an available target connection.')
    if (id !== this.connectionId || !this.targetConfirmed) {
      this.scheduler.stop('interrupted')
      this.matrixPreview = []
    }
    this.connectionId = id
    this.targetConfirmed = true
  }
  openDraft(
    operation: Operation,
    connectionId?: string,
    pageEpoch?: string,
  ): void {
    this.scheduler.stop('interrupted')
    this.kind = operation.kind
    this.name = operation.name
    this.parametersText = JSON.stringify(operation.parameters, null, 2)
    this.selectedCaseId = ''
    this.unresolvedRequestMasks = []
    this.resolvedRequestMasks = []
    this.matrixPreview = []
    this.targetConfirmed =
      pageEpoch === this.pageEpoch &&
      connectionId !== undefined &&
      this.connections.some(connection => connection.id === connectionId)
    if (connectionId) this.connectionId = connectionId
    this.notice = this.targetConfirmed
      ? 'Captured arguments loaded. Review before running.'
      : 'This capture needs an explicit available target before running.'
  }
  newDraft(): void {
    this.openDraft(
      { kind: 'method', name: '', parameters: [] },
      this.connectionId,
      this.pageEpoch,
    )
    this.title = ''
    this.notes = ''
    this.tagsText = ''
    this.expectationsText = '[]'
    this.excludedPathsText = '[]'
    this.matrixText = JSON.stringify(
      { includeBaseline: true, changes: [] },
      null,
      2,
    )
    this.mode = 'application'
    this.isolatedAuthentication = 'anonymous'
  }
  get operation(): Operation {
    return {
      kind: this.kind,
      name: this.name,
      parameters: parseParameters(this.parametersText),
    }
  }
  get context(): ExecutionContext {
    return this.mode === 'application'
      ? { mode: 'application', authentication: 'current' }
      : { mode: 'isolated', authentication: this.isolatedAuthentication }
  }
  get expectations(): Expectation[] {
    return parseArray(this.expectationsText).map(value =>
      parseExpectation(value),
    )
  }
  get excludedPaths(): string[] {
    return parseArray(this.excludedPathsText).map(value => {
      if (typeof value !== 'string')
        throw new TypeError(
          'Comparison exclusions must be JSON Pointer strings.',
        )
      return value
    })
  }
  get selectedRun(): RunRecord | undefined {
    return this.runs.find(
      record => record.request.requestId === this.selectedRunId,
    )
  }
  get matrixRunning(): boolean {
    return this.matrixProgress !== undefined && this.scheduler.running
  }
  setField<
    K extends
      | 'name'
      | 'kind'
      | 'parametersText'
      | 'mode'
      | 'isolatedAuthentication'
      | 'sessionLabel'
      | 'waitMs'
      | 'title'
      | 'notes'
      | 'tagsText'
      | 'expectationsText'
      | 'excludedPathsText'
      | 'matrixText'
      | 'matrixDelayMs'
      | 'continueOnError'
      | 'selectedRunId'
      | 'comparisonLeft'
      | 'comparisonRight'
      | 'transferMasksText',
  >(key: K, value: this[K]): void {
    this[key] = value
    if (
      [
        'name',
        'kind',
        'parametersText',
        'mode',
        'isolatedAuthentication',
        'matrixText',
        'waitMs',
        'sessionLabel',
        'expectationsText',
      ].includes(key)
    ) {
      this.scheduler.stop('interrupted')
      this.matrixPreview = []
    }
  }
  private buildRequest(operation = this.operation): RunCommand {
    if (this.unresolvedRequestMasks.length > 0)
      throw new Error(
        'Review replacements for all masked request fields before running or previewing a matrix.',
      )
    if (
      !this.targetConfirmed ||
      !this.connections.some(connection => connection.id === this.connectionId)
    )
      throw new Error('Select an explicit available target connection.')
    if (!this.sessionReady || !this.send)
      throw new Error('Waiting for the inspected page playground session.')
    if (
      [...this.requests.keys()].filter(
        id =>
          !this.runs.find(record => record.request.requestId === id)?.finished,
      ).length >= PLAYGROUND_LIMITS.activeOperations
    )
      throw new Error(
        'Three operations are already active; stop one before running another.',
      )
    void this.expectations
    const command = parseCommand({
      ...this.identity(),
      kind: 'run',
      requestId: crypto.randomUUID(),
      connectionId: this.connectionId,
      operation,
      ...this.context,
      sessionLabel: this.sessionLabel,
      waitMs: this.waitMs,
    })
    if (command.kind !== 'run') throw new Error('Expected a run command.')
    return command
  }
  private dispatch(request: RunCommand): void {
    this.requests.set(request.requestId, request)
    const savedCase = this.cases.find(
      record => record.id === this.selectedCaseId,
    )
    if (savedCase)
      this.caseReferences.set(request.requestId, {
        caseId: savedCase.id,
        caseRevision: savedCase.revision,
      })
    this.selectedRunId = request.requestId
    try {
      this.send?.(request)
    } catch (error) {
      this.requests.delete(request.requestId)
      this.pending.delete(request.requestId)
      this.caseReferences.delete(request.requestId)
      throw error
    }
  }
  run(): string {
    if (this.scheduler.running)
      throw new Error('Stop the matrix before starting another operation.')
    const request = this.buildRequest()
    this.dispatch(request)
    return request.requestId
  }
  stop(requestId: string): void {
    this.send?.({ ...this.identity(), kind: 'stop', requestId })
  }
  snapshot(requestId: string): void {
    this.send?.({ ...this.identity(), kind: 'snapshot', requestId })
  }
  stopAll(): void {
    this.scheduler.stop()
    this.command('stop-all')
  }
  previewMatrix(): void {
    this.matrixPreview = generateMatrix(
      this.operation.parameters,
      JSON.parse(this.matrixText) as MatrixDefinition,
    )
    this.buildRequest()
    this.notice = `Review all ${this.matrixPreview.length} effective argument sets before starting.`
  }
  async startMatrix(): Promise<void> {
    if (this.matrixPreview.length === 0)
      throw new Error('Preview the matrix first.')
    await this.scheduler.start(toJS(this.matrixPreview), {
      delayMs: this.matrixDelayMs,
      continueOnError: this.continueOnError,
    })
  }
  private executeMatrixVariant(variant: MatrixVariant) {
    const request = this.buildRequest({
      ...this.operation,
      parameters: variant.parameters,
    })
    const result = new Promise<RunOutcome>(resolve =>
      this.pending.set(request.requestId, {
        resolve,
        subscription: request.operation.kind === 'subscription',
        stopping: false,
        expectations: toJS(this.expectations),
      }),
    )
    this.dispatch(request)
    return { result, stop: () => this.stop(request.requestId) }
  }
  stopMatrix(): void {
    this.scheduler.stop()
  }
  observeLog(log: PlaygroundLog): void {
    try {
      const value: unknown = JSON.parse(log.content)
      validateValue(value)
      if (!value || typeof value !== 'object' || Array.isArray(value)) return
      let kind: Operation['kind'] | undefined
      if (value.msg === 'method') kind = 'method'
      else if (value.msg === 'sub') kind = 'subscription'
      const name = kind === 'method' ? value.method : value.name
      const parameters = value.params === undefined ? [] : value.params
      if (!kind || typeof name !== 'string' || !Array.isArray(parameters))
        return
      this.catalog.observe({
        pageEpoch: log.pageEpoch ?? this.pageEpoch,
        connectionId: log.connectionId,
        kind,
        name,
        parameters,
        provenance: log.provenance ?? 'application',
        internal: log.internal,
        time: log.timestamp,
      })
      this.catalogRevision += 1
    } catch {
      /* Malformed DDP messages remain traffic, not executable drafts. */
    }
  }
  get catalogEntries() {
    void this.catalogRevision
    return this.catalog.entries(this.pageEpoch, this.connectionId)
  }
  clearCatalog(): void {
    this.catalog.clear(this.pageEpoch, this.connectionId)
    this.catalogRevision += 1
  }
  async loadSaved(): Promise<void> {
    const [cases, snapshots] = await Promise.all([
      this.storage.readCases(),
      this.storage.readSnapshots(),
    ])
    runInAction(() => {
      this.cases = cases.records
      this.snapshots = snapshots.records
      this.storageErrors = [...cases.errors, ...snapshots.errors].map(
        error => `${error.id}: ${error.error}`,
      )
    })
  }
  saveCase(): void {
    const previous = this.cases.find(
      record => record.id === this.selectedCaseId,
    )
    const now = Date.now()
    const record = parseCase({
      id: previous?.id ?? crypto.randomUUID(),
      version: 1,
      revision: (previous?.revision ?? 0) + 1,
      title: this.title,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      operation: this.operation,
      context: this.context,
      endpointHint: this.connections.find(
        connection => connection.id === this.connectionId,
      )?.displayName,
      notes: this.notes,
      tags: this.tagsText
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
      expectations: this.expectations,
      matrix: JSON.parse(this.matrixText),
      excludedPaths: this.excludedPaths,
      redactedPaths: previous
        ? toJS(previous.redactedPaths).filter(
            path => !this.resolvedRequestMasks.includes(path),
          )
        : [],
    })
    this.transferPreview = previewExport([record], [], {})
    this.transferKind = 'case'
    this.transferMasksText = '{}'
    this.transferMasksApplied = '{}'
  }
  loadCase(id: string): void {
    const record = this.cases.find(item => item.id === id)
    if (!record) return
    this.openDraft(record.operation)
    this.selectedCaseId = id
    this.unresolvedRequestMasks = record.redactedPaths.filter(
      path =>
        path === '/operation/parameters' ||
        path.startsWith('/operation/parameters/'),
    )
    this.title = record.title ?? ''
    this.notes = record.notes ?? ''
    this.tagsText = record.tags.join(', ')
    this.mode = record.context.mode
    this.isolatedAuthentication =
      record.context.mode === 'isolated'
        ? record.context.authentication
        : 'anonymous'
    this.expectationsText = JSON.stringify(record.expectations, null, 2)
    this.excludedPathsText = JSON.stringify(record.excludedPaths, null, 2)
    this.matrixText = JSON.stringify(
      record.matrix ?? { includeBaseline: true, changes: [] },
      null,
      2,
    )
  }
  /**
   * Masked array entries are null placeholders, not executable arguments until
   * the user explicitly reviews replacement values. Missing properties must be
   * restored; a null value is accepted only through this deliberate action.
   */
  resolveRequestMasks(): void {
    const parameters = this.operation.parameters
    for (const path of this.unresolvedRequestMasks) {
      readPointer(parameters, path.slice('/operation/parameters'.length))
    }
    this.resolvedRequestMasks = [
      ...new Set([
        ...this.resolvedRequestMasks,
        ...this.unresolvedRequestMasks,
      ]),
    ]
    this.unresolvedRequestMasks = []
    this.notice =
      'Replacement parameters explicitly reviewed. Review the target and operation before running.'
  }
  async deleteCase(id: string): Promise<void> {
    await this.storage.deleteCase(id)
    if (this.selectedCaseId === id) this.selectedCaseId = ''
    await this.loadSaved()
  }
  async deleteSnapshot(id: string): Promise<void> {
    await this.storage.deleteSnapshot(id)
    await this.loadSaved()
  }
  get comparison() {
    const left =
        this.snapshots.find(item => item.id === this.comparisonLeft) ??
        this.runs.find(item => item.request.requestId === this.comparisonLeft),
      right =
        this.snapshots.find(item => item.id === this.comparisonRight) ??
        this.runs.find(item => item.request.requestId === this.comparisonRight)
    return left && right
      ? compareEvidence(
          toJS(
            'readiness' in left
              ? (left.readiness ?? left.evidence)
              : left.evidence,
          ),
          toJS(
            'readiness' in right
              ? (right.readiness ?? right.evidence)
              : right.evidence,
          ),
          this.excludedPaths,
        )
      : undefined
  }
  private runSemantics(record: RunRecord): string {
    if (record.request.operation.kind === 'method')
      return 'Fresh invocation using selected Meteor connection; client stubs may run.'
    return record.request.mode === 'application'
      ? 'Shared connection-level evidence; overlapping subscriptions may contribute.'
      : 'Isolated connection evidence; ambient publications may contribute.'
  }
  previewSnapshot(boundary: 'current' | 'readiness' = 'current'): void {
    const record = this.selectedRun
    if (!record) throw new Error('Select a run first.')
    const evidence =
      boundary === 'readiness' ? record.readiness : record.evidence
    if (!evidence) throw new Error('This run has no readiness capture.')
    const snapshot: SavedSnapshot = {
      id: crypto.randomUUID(),
      version: 1,
      capturedAt: Date.now(),
      ...this.caseReferences.get(record.request.requestId),
      request: {
        operation: toJS(record.request.operation),
        context:
          record.request.mode === 'application'
            ? { mode: 'application', authentication: 'current' }
            : {
                mode: 'isolated',
                authentication: record.request.authentication,
              },
        sessionLabel: record.request.sessionLabel,
      },
      endpointLabel: record.endpointLabel,
      authentication: toJS(record.authentication),
      semantics: this.runSemantics(record),
      outcome: evidence.outcome,
      completion: {
        result: record.method?.resultSeen ?? false,
        writes: record.method?.writesReflected ?? false,
        ready:
          record.readiness !== undefined ||
          record.evidence.boundary === 'readiness',
      },
      evidence: toJS(evidence),
      timing: {
        startedAt: record.startedAt,
        ...(record.method?.serverElapsedMs === undefined
          ? {}
          : { responseMs: record.method.serverElapsedMs }),
        ...(record.finished
          ? { completedMs: record.updatedAt - record.startedAt }
          : {}),
      },
      incompleteReasons: [...record.reasons],
      redactedPaths: [],
    }
    this.transferPreview = previewExport([], [snapshot], {})
    this.transferKind = 'snapshot'
    this.transferMasksText = '{}'
    this.transferMasksApplied = '{}'
  }
  previewExport(caseIds?: string[], snapshotIds?: string[]): void {
    this.transferPreview = previewExport(
      toJS(this.cases).filter(
        record => !caseIds || caseIds.includes(record.id),
      ),
      toJS(this.snapshots).filter(
        record => !snapshotIds || snapshotIds.includes(record.id),
      ),
      {},
    )
    this.transferKind = 'export'
    this.transferMasksText = '{}'
    this.transferMasksApplied = '{}'
  }
  previewImport(text: string): void {
    const file = parseImport(text)
    this.transferPreview = previewExport(
      file.cases,
      file.snapshots,
      {},
      file.exportedAt,
    )
    this.transferKind = 'import'
    this.transferMasksText = '{}'
    this.transferMasksApplied = '{}'
  }
  applyMasks(): void {
    if (!this.transferPreview) return
    const masks: unknown = JSON.parse(this.transferMasksText)
    validateValue(masks)
    if (
      !masks ||
      typeof masks !== 'object' ||
      Array.isArray(masks) ||
      Object.values(masks).some(
        paths =>
          !Array.isArray(paths) || paths.some(path => typeof path !== 'string'),
      )
    )
      throw new TypeError(
        'Masks must map record IDs to arrays of JSON Pointers.',
      )
    this.transferPreview = previewExport(
      toJS(this.transferPreview.cases),
      toJS(this.transferPreview.snapshots),
      masks as Record<string, string[]>,
      this.transferPreview.exportedAt,
    )
    this.transferMasksApplied = this.transferMasksText
  }
  async confirmTransfer(): Promise<string | undefined> {
    if (!this.transferPreview || !this.transferKind)
      throw new Error('Review a preview first.')
    if (this.transferMasksText !== this.transferMasksApplied)
      throw new Error(
        'Apply masks and review the updated preview before confirming.',
      )
    const file = toJS(this.transferPreview)!
    if (this.transferKind === 'export') return JSON.stringify(file, null, 2)
    if (this.transferKind === 'case') {
      const record = file.cases[0]
      if (!record || file.cases.length !== 1)
        throw new Error('Expected one reviewed case.')
      const saved = await this.storage.saveCase(record)
      runInAction(() => {
        this.selectedCaseId = saved.id
        this.notice = `Saved case revision ${saved.revision}.`
      })
    } else if (this.transferKind === 'snapshot') {
      for (const snapshot of file.snapshots)
        await this.storage.saveSnapshot(snapshot)
    } else await this.storage.importReviewed(file)
    runInAction(() => {
      this.transferPreview = undefined
      this.transferKind = undefined
    })
    await this.loadSaved()
    return undefined
  }
  cancelTransfer(): void {
    this.transferPreview = undefined
    this.transferKind = undefined
  }
  async attempt(action: () => unknown | Promise<unknown>): Promise<void> {
    this.error = ''
    try {
      await action()
    } catch (error) {
      runInAction(() => {
        this.error = message(error)
      })
    }
  }
}

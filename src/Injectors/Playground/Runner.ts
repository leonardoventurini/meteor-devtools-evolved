import {
  parseCommand,
  type RunCommand,
  type SessionIdentity,
} from '../../Playground/Commands'
import type { DocumentSnapshot } from '../../Playground/Documents'
import type { EvidenceSnapshot } from '../../Playground/Evidence'
import { PLAYGROUND_LIMITS } from '../../Playground/Limits'
import {
  createMethodRun,
  reduceMethodRun,
  type MethodSignal,
} from '../../Playground/MethodRun'
import type {
  AuthenticationObservation,
  RunRecord,
  RunnerEvent,
} from '../../Playground/RunRecord'
import { SessionLedger } from '../../Playground/SessionLedger'
import { serializedBytes } from '../../Playground/Values'
import {
  invokeMethod,
  type MethodConnection,
  type MethodCodec,
  type MethodHandle,
} from './MethodAdapter'
import { assertNoRetryCapability } from './NoRetryCapability'
import {
  startPublication,
  type PublicationConnection,
  type PublicationHandle,
  type PublicationSignal,
} from './PublicationAdapter'

export type { RunnerEvent } from '../../Playground/RunRecord'
export interface ExecutionTarget {
  connection: MethodConnection & PublicationConnection
  endpointLabel: string
  authentication: AuthenticationObservation
  baseline?: DocumentSnapshot
  sourceCurrent?(): boolean
  dispose?(): void
}
export interface RunnerDependencies {
  pageEpoch: string
  resolveTarget(connectionId: string): ExecutionTarget | undefined
  openIsolated(
    source: ExecutionTarget,
    command: RunCommand,
    signal: AbortSignal,
  ): Promise<ExecutionTarget>
  codec: MethodCodec
  nonreactive<T>(action: () => T): T
  emit(event: RunnerEvent): void
  now?: () => number
}
interface Entry {
  record: RunRecord
  target?: ExecutionTarget
  source: ExecutionTarget
  controller: AbortController
  method?: MethodHandle
  publication?: PublicationHandle
  waitTimer?: ReturnType<typeof setTimeout>
  releaseTimer?: ReturnType<typeof setTimeout>
  disposed: boolean
  bytes: number
  frames: number
}
const emptyEvidence = (): EvidenceSnapshot => ({
  data: {},
  completePaths: [],
  redactedPaths: [],
  truncated: false,
  documentBaseline: 'unknown',
  outcome: 'pending',
})
const unfinishedMethod = new Set(['queued', 'running'])

/**
 * Page-local orchestration owns leases, targets and observation budgets. Inputs
 * are parsed before routing and every accepted request ID stays in the session
 * ledger even if preflight fails. Late evidence can enrich an existing record,
 * but never restarts work or consumes another execution slot.
 */
export class PlaygroundRunner {
  private readonly entries = new Map<string, Entry>()
  private readonly ledger: SessionLedger
  private readonly now: () => number
  private readonly pollTimer: ReturnType<typeof setInterval>
  private disposed = false
  private sequence = 0
  constructor(private readonly dependencies: RunnerDependencies) {
    this.now = dependencies.now ?? Date.now
    this.ledger = new SessionLedger(dependencies.pageEpoch, this.now, id =>
      this.retire(id),
    )
    this.pollTimer = setInterval(() => {
      this.ledger.expire()
      for (const entry of this.entries.values()) {
        if (
          !entry.record.finished &&
          (entry.source.sourceCurrent?.() === false ||
            entry.target?.sourceCurrent?.() === false)
        )
          this.stop(entry, 'disconnect')
      }
    }, PLAYGROUND_LIMITS.leaseRenewMs)
    dependencies.emit({ kind: 'hello', pageEpoch: dependencies.pageEpoch })
  }
  handle(input: unknown): void {
    if (this.disposed) return
    let identity: SessionIdentity | undefined
    let requestId: string | undefined
    try {
      const command = parseCommand(input)
      identity = command
      if ('requestId' in command) requestId = command.requestId
      if (command.kind === 'open') {
        this.ledger.open(command.panelSessionId, command.pageEpoch)
        this.dependencies.emit({
          kind: 'session',
          panelSessionId: command.panelSessionId,
          pageEpoch: command.pageEpoch,
        })
        return
      }
      if (command.kind === 'renew') {
        this.ledger.renew(command.panelSessionId, command.pageEpoch)
        return
      }
      if (command.kind === 'close') {
        this.ledger.close(command.panelSessionId, command.pageEpoch)
        return
      }
      this.ledger.assertActive(command.panelSessionId, command.pageEpoch)
      if (command.kind === 'stop-all') {
        this.retire(command.panelSessionId)
        return
      }
      if (command.kind === 'stop') {
        const entry = this.entries.get(command.requestId)
        if (entry?.record.request.panelSessionId === command.panelSessionId)
          this.stop(entry, 'stop')
        return
      }
      if (command.kind === 'snapshot') {
        this.capture(command.requestId, command)
        return
      }
      if (command.kind !== 'run') return
      if (this.ledger.accept(command) === 'duplicate') return
      this.start(command)
    } catch (error) {
      this.dependencies.emit({
        kind: 'error',
        ...(identity ? { panelSessionId: identity.panelSessionId } : {}),
        ...(requestId ? { requestId } : {}),
        message:
          error instanceof Error
            ? error.message
            : 'Playground operation failed.',
      })
    }
  }
  capture(requestId: string, identity: SessionIdentity): void {
    this.ledger.assertActive(identity.panelSessionId, identity.pageEpoch)
    const entry = this.entries.get(requestId)
    if (
      !entry ||
      entry.record.request.panelSessionId !== identity.panelSessionId
    )
      throw new Error('No matching playground run.')
    if (entry.publication)
      entry.record.evidence = entry.publication.snapshot('manual')
    this.publish(entry)
  }
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    clearInterval(this.pollTimer)
    for (const entry of this.entries.values()) {
      this.stop(entry, 'stop')
      this.release(entry)
    }
    this.entries.clear()
  }
  private retire(id: string): void {
    for (const entry of this.entries.values())
      if (entry.record.request.panelSessionId === id) {
        this.stop(entry, 'stop')
        this.release(entry)
      }
  }
  private start(command: RunCommand): void {
    if (
      [...this.entries.values()].filter(entry => !entry.record.finished)
        .length >= PLAYGROUND_LIMITS.activeOperations
    )
      throw new Error('Three playground operations are already active.')
    const source = this.dependencies.resolveTarget(command.connectionId)
    if (
      !source ||
      source.sourceCurrent?.() === false ||
      !source.connection.status().connected
    )
      throw new Error(
        'The selected connection is unavailable; select a live target explicitly.',
      )
    const startedAt = this.now()
    const entry: Entry = {
      record: {
        request: structuredClone(command),
        sequence: this.sequence,
        startedAt,
        updatedAt: startedAt,
        phase: command.mode === 'isolated' ? 'connecting' : 'queued',
        finished: false,
        endpointLabel: source.endpointLabel,
        authentication: structuredClone(source.authentication),
        evidence: emptyEvidence(),
        reasons: [],
      },
      source,
      controller: new AbortController(),
      disposed: false,
      bytes: 0,
      frames: 0,
    }
    this.entries.set(command.requestId, entry)
    entry.waitTimer = setTimeout(
      () => this.stop(entry, 'timeout'),
      command.waitMs,
    )
    this.publish(entry)
    if (command.mode === 'application') {
      this.execute(entry, source)
      return
    }
    void this.dependencies
      .openIsolated(source, command, entry.controller.signal)
      .then(target => {
        if (
          entry.record.finished ||
          this.disposed ||
          entry.controller.signal.aborted
        ) {
          target.dispose?.()
          return
        }
        this.execute(entry, target)
      })
      .catch(() => {
        if (!entry.record.finished)
          this.fail(
            entry,
            'Isolated connection setup or authentication failed.',
          )
      })
  }
  private execute(entry: Entry, target: ExecutionTarget): void {
    entry.target = target
    if (
      entry.source.sourceCurrent?.() === false ||
      target.sourceCurrent?.() === false ||
      !target.connection.status().connected
    ) {
      this.fail(entry, 'The selected connection changed before dispatch.')
      return
    }
    const remaining =
      entry.record.request.waitMs - (this.now() - entry.record.startedAt)
    if (remaining <= 0) {
      this.stop(entry, 'timeout')
      return
    }
    entry.record.authentication = structuredClone(target.authentication)
    entry.record.endpointLabel = target.endpointLabel
    const command = entry.record.request
    try {
      if (command.operation.kind === 'method') {
        assertNoRetryCapability(target.connection)
        entry.record.method = createMethodRun(entry.record.startedAt)
        entry.method = invokeMethod({
          connection: target.connection,
          operation: command.operation,
          codec: this.dependencies.codec,
          now: this.now,
          emit: signal => this.methodSignal(entry, signal),
        })
        // Native callbacks may finish synchronously before the handle is returned.
        if (entry.disposed) entry.method.stopObserving()
      } else {
        entry.publication = startPublication({
          connection: target.connection,
          operation: command.operation,
          codec: this.dependencies.codec,
          mode: command.mode === 'isolated' ? 'isolated' : 'shared',
          baseline: target.baseline,
          nonreactive: this.dependencies.nonreactive,
          waitMs: remaining,
          now: this.now,
          emit: signal => this.publicationSignal(entry, signal),
          disposeConnection: () => this.disposeTarget(entry),
        })
        if (entry.disposed) entry.publication.stopObserving()
      }
    } catch {
      this.fail(
        entry,
        'Native execution capability unavailable on the selected connection.',
      )
    }
  }
  private methodSignal(entry: Entry, signal: MethodSignal): void {
    if (entry.disposed || !entry.record.method) return
    entry.record.method = reduceMethodRun(entry.record.method, signal)
    const method = entry.record.method
    entry.record.phase = method.phase
    entry.record.finished = !unfinishedMethod.has(method.phase)
    entry.record.evidence = {
      data: {
        ...(method.result === undefined ? {} : { result: method.result }),
        ...(method.error === undefined ? {} : { error: method.error }),
      },
      completePaths: method.resultSeen ? [''] : [],
      redactedPaths: [],
      truncated: false,
      documentBaseline: 'known',
      outcome: method.outcome,
    }
    if (method.message && !entry.record.reasons.includes(method.message))
      entry.record.reasons.push(method.message)
    if (entry.record.finished) {
      clearTimeout(entry.waitTimer)
      if (entry.record.request.mode === 'isolated') this.disposeTarget(entry)
      if (!entry.releaseTimer)
        entry.releaseTimer = setTimeout(
          () => this.release(entry),
          PLAYGROUND_LIMITS.maxWaitMs,
        )
    }
    this.publish(entry)
  }
  private publicationSignal(entry: Entry, signal: PublicationSignal): void {
    if (entry.disposed) return
    if (signal.kind === 'dispatch') {
      entry.record.phase = 'running'
      entry.record.subscriptionId = signal.subscriptionId
      entry.record.baseline = signal.baseline
      entry.record.reasons.push(signal.caveat)
    } else if (signal.kind === 'local-error') {
      entry.record.reasons.push(signal.message)
    } else {
      entry.record.evidence = signal.evidence
      entry.record.reasons = [
        ...new Set([...entry.record.reasons, ...signal.reasons]),
      ]
      if (signal.kind === 'ready') {
        entry.record.phase = 'ready'
        entry.record.readiness = structuredClone(signal.evidence)
        clearTimeout(entry.waitTimer)
      }
      if (signal.kind === 'stopped') {
        entry.record.finished = true
        const phases: Partial<
          Record<typeof signal.reason, RunRecord['phase']>
        > = {
          timeout: 'timed-out',
          'capture-limit': 'limit-exceeded',
          disconnect: 'interrupted',
          server: 'settled',
        }
        entry.record.phase = phases[signal.reason] ?? 'stopped'
        clearTimeout(entry.waitTimer)
        this.disposeTarget(entry)
      }
    }
    this.publish(entry)
  }
  private stop(entry: Entry, kind: 'stop' | 'timeout' | 'disconnect'): void {
    if (entry.record.finished) return
    entry.controller.abort()
    clearTimeout(entry.waitTimer)
    if (entry.record.method) this.methodSignal(entry, { kind, at: this.now() })
    else if (entry.publication) {
      entry.publication.stop()
      if (kind !== 'stop') {
        entry.record.phase = kind === 'timeout' ? 'timed-out' : 'interrupted'
        this.publish(entry)
      }
    } else {
      entry.record.finished = true
      const phases = {
        timeout: 'timed-out',
        disconnect: 'interrupted',
        stop: 'stopped',
      } as const
      entry.record.phase = phases[kind]
      entry.record.evidence.outcome = 'unknown'
      this.disposeTarget(entry)
      this.publish(entry)
    }
  }
  private fail(entry: Entry, message: string): void {
    entry.record.reasons.push(message)
    this.stop(entry, 'stop')
    entry.record.phase = 'local-error'
    this.publish(entry)
  }
  private disposeTarget(entry: Entry): void {
    if (entry.record.request.mode !== 'isolated' || !entry.target?.dispose)
      return
    const dispose = entry.target.dispose
    entry.target = { ...entry.target, dispose: undefined }
    try {
      dispose()
    } catch {
      entry.record.reasons.push('Owned connection cleanup failed.')
    }
  }
  private release(entry: Entry): void {
    if (entry.disposed) return
    entry.disposed = true
    entry.controller.abort()
    clearTimeout(entry.waitTimer)
    clearTimeout(entry.releaseTimer)
    entry.method?.stopObserving()
    entry.publication?.stopObserving()
    this.disposeTarget(entry)
  }
  private publish(entry: Entry): void {
    entry.record.updatedAt = this.now()
    entry.record.sequence = ++this.sequence
    entry.frames += 1
    let encoded = JSON.stringify(entry.record)
    if (
      serializedBytes(JSON.stringify({ kind: 'run', record: entry.record })) >
        PLAYGROUND_LIMITS.runBytes ||
      entry.frames > PLAYGROUND_LIMITS.runFrames
    ) {
      entry.record.evidence = {
        ...emptyEvidence(),
        outcome: entry.record.evidence.outcome,
        truncated: true,
      }
      delete entry.record.baseline
      delete entry.record.readiness
      if (entry.record.method) {
        delete entry.record.method.result
        delete entry.record.method.error
        if (entry.record.method.message)
          entry.record.method.message = entry.record.method.message.slice(
            0,
            2048,
          )
      }
      delete entry.record.authentication.userId
      entry.record.authentication.provenance =
        entry.record.authentication.provenance.slice(0, 1024)
      entry.record.endpointLabel = entry.record.endpointLabel.slice(0, 2048)
      entry.record.reasons = [
        'Run capture limit reached; server work may continue after local capture stops.',
      ]
      entry.record.phase = 'limit-exceeded'
      entry.record.finished = true
      this.release(entry)
      encoded = JSON.stringify(entry.record)
    }
    entry.bytes = serializedBytes(encoded)
    this.dependencies.emit({
      kind: 'run',
      record: JSON.parse(encoded) as RunRecord,
    })
    let bytes = [...this.entries.values()].reduce(
      (sum, item) => sum + item.bytes,
      0,
    )
    for (const [id, item] of this.entries) {
      if (
        this.entries.size <= PLAYGROUND_LIMITS.historyRuns &&
        bytes <= PLAYGROUND_LIMITS.historyBytes
      )
        break
      if (!item.record.finished || item === entry) continue
      this.release(item)
      this.entries.delete(id)
      bytes -= item.bytes
    }
  }
}

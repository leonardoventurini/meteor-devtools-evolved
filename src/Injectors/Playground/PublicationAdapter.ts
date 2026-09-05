import type { Operation } from '../../Playground/Commands'
import {
  PublicationDocuments,
  type DocumentSnapshot,
} from '../../Playground/Documents'
import type { EvidenceSnapshot } from '../../Playground/Evidence'
import { validateValue, type EncodedValue } from '../../Playground/Values'
import { PLAYGROUND_LIMITS } from '../../Playground/Limits'
import type { MethodCodec } from './MethodAdapter'
import { markPlaygroundFrame } from './CaptureProvenance'
import { observeStream, type ObservableStream } from './StreamObserver'

export interface PublicationConnection {
  _stream: ObservableStream
  status(): { connected: boolean }
  subscribe(
    name: string,
    ...parameters: unknown[]
  ): { subscriptionId: string; stop(): void }
}
export type PublicationStopReason =
  | 'manual'
  | 'timeout'
  | 'budget'
  | 'disconnect'
  | 'server'
  | 'capture-limit'
  | 'disposed'
export type PublicationSignal =
  | {
      kind: 'dispatch'
      at: number
      subscriptionId: string
      baseline: EvidenceSnapshot
      caveat: string
    }
  | {
      kind: 'ready' | 'evidence'
      at: number
      evidence: EvidenceSnapshot
      reasons: string[]
    }
  | {
      kind: 'stopped'
      at: number
      reason: PublicationStopReason
      evidence: EvidenceSnapshot
      reasons: string[]
    }
  | { kind: 'local-error'; at: number; message: string }
export interface PublicationHandle {
  stop(): void
  stopObserving(): void
  snapshot(boundary?: 'manual' | 'readiness'): EvidenceSnapshot
}
interface Request {
  connection: PublicationConnection
  operation: Operation
  codec: MethodCodec
  mode: 'shared' | 'isolated'
  nonreactive<T>(action: () => T): T
  baseline?: DocumentSnapshot
  emit(signal: PublicationSignal): void
  now?: () => number
  waitMs?: number
  disposeConnection?(): void
}
const noop = () => {}

/**
 * Owns exactly the native subscription returned outside Tracker. Shared evidence
 * belongs to the connection, and isolated evidence may include ambient data.
 * Stopping disposes listeners and timers before touching the native handle so
 * synchronous unsubscribe traffic and late readiness cannot restart a probe.
 */
export const startPublication = ({
  connection,
  operation,
  codec,
  mode,
  nonreactive,
  baseline,
  emit,
  now = Date.now,
  waitMs = PLAYGROUND_LIMITS.waitMs,
  disposeConnection = noop,
}: Request): PublicationHandle => {
  const documents = new PublicationDocuments(baseline)
  let outcome: EvidenceSnapshot['outcome'] = 'pending'
  let serverError: EncodedValue | undefined
  let subscription: ReturnType<PublicationConnection['subscribe']> | undefined
  let active = true
  let ready = false
  let subscribing = false
  let observedSubscriptionId: string | undefined
  const pendingFrames: Array<Record<string, unknown>> = []
  let release = noop
  let waitTimer: ReturnType<typeof setTimeout> | undefined
  let budgetTimer: ReturnType<typeof setTimeout> | undefined
  const snapshot = (boundary: 'manual' | 'readiness' = 'manual') => {
    const evidence = documents.snapshot(outcome, boundary)
    if (serverError !== undefined) {
      evidence.data.error = structuredClone(serverError)
      evidence.completePaths.push('/error')
    }
    return evidence
  }
  const finish = (reason: PublicationStopReason) => {
    if (!active) return
    active = false
    clearTimeout(waitTimer)
    clearTimeout(budgetTimer)
    release()
    if (outcome === 'pending') outcome = 'unknown'
    try {
      subscription?.stop()
    } catch {
      documents.incomplete('The native subscription stop operation failed.')
    }
    if (mode === 'isolated') {
      try {
        disposeConnection()
      } catch {
        documents.incomplete('Owned connection disposal failed.')
      }
    }
    emit({
      kind: 'stopped',
      reason,
      at: now(),
      evidence: snapshot(),
      reasons: [...documents.reasons],
    })
  }
  const handle: PublicationHandle = {
    stop: () => finish('manual'),
    stopObserving: () => finish('disposed'),
    snapshot,
  }
  const processFrame = (frame: Record<string, unknown>) => {
    if (!active) return
    if (
      subscription &&
      frame.msg === 'ready' &&
      Array.isArray(frame.subs) &&
      frame.subs.includes(subscription.subscriptionId) &&
      !ready
    ) {
      ready = true
      outcome = 'success'
      clearTimeout(waitTimer)
      emit({
        kind: 'ready',
        at: now(),
        evidence: snapshot('readiness'),
        reasons: [...documents.reasons],
      })
    } else if (
      subscription &&
      frame.msg === 'nosub' &&
      frame.id === subscription.subscriptionId
    ) {
      outcome = Object.hasOwn(frame, 'error') ? 'error' : 'success'
      if (Object.hasOwn(frame, 'error')) {
        try {
          validateValue(frame.error)
          serverError = frame.error
        } catch {
          documents.incomplete('Server error exceeds supported value limits.')
        }
      }
      finish('server')
    } else if (['added', 'changed', 'removed'].includes(String(frame.msg))) {
      emit({
        kind: 'evidence',
        at: now(),
        evidence: snapshot(),
        reasons: [...documents.reasons],
      })
    }
  }
  try {
    if (documents.truncated)
      throw new Error('Publication baseline exceeds capture limits.')
    if (operation.kind !== 'subscription')
      throw new TypeError('Expected a subscription operation.')
    if (!connection.status().connected)
      throw new Error('The selected connection is disconnected.')
    if (
      !Number.isInteger(waitMs) ||
      waitMs < 1 ||
      waitMs > PLAYGROUND_LIMITS.maxWaitMs
    )
      throw new TypeError('Invalid publication readiness timeout.')
    const parameters = operation.parameters.map(value => codec.decode(value))
    const initial = snapshot()
    release = observeStream(connection._stream, {
      outbound: raw => {
        if (!subscribing || observedSubscriptionId !== undefined) return
        try {
          const frame = JSON.parse(raw) as Record<string, unknown>
          if (
            frame?.msg !== 'sub' ||
            frame.name !== operation.name ||
            typeof frame.id !== 'string'
          )
            return
          observedSubscriptionId = frame.id
          markPlaygroundFrame(connection._stream, raw)
        } catch {
          /* Malformed unrelated transport traffic has no probe provenance. */
        }
      },
      inbound: raw => {
        if (!active) return
        documents.observe(raw)
        if (documents.truncated) {
          finish('capture-limit')
          return
        }
        let frame: Record<string, unknown>
        try {
          frame = JSON.parse(raw) as Record<string, unknown>
        } catch {
          return
        }
        if (!frame || typeof frame !== 'object') return
        if (subscription) {
          processFrame(frame)
        } else {
          pendingFrames.push(frame)
        }
      },
      disconnect: () => {
        documents.incomplete(
          'Connection interrupted during publication observation.',
        )
        finish('disconnect')
      },
    })
    const dispatchedAt = now()
    subscribing = true
    try {
      subscription = nonreactive(() =>
        connection.subscribe(operation.name, ...parameters),
      )
    } finally {
      subscribing = false
    }
    if (
      !subscription ||
      typeof subscription.subscriptionId !== 'string' ||
      typeof subscription.stop !== 'function'
    )
      throw new Error('Native owned subscription capability unavailable.')
    if (
      observedSubscriptionId !== undefined &&
      observedSubscriptionId !== subscription.subscriptionId
    )
      throw new Error(
        'Native subscription identity did not match its dispatched frame.',
      )
    if (!active) {
      subscription.stop()
      return handle
    }
    emit({
      kind: 'dispatch',
      at: dispatchedAt,
      subscriptionId: subscription.subscriptionId,
      baseline: initial,
      caveat:
        mode === 'isolated'
          ? 'Ambient server publications may contribute; this is connection-level evidence.'
          : 'Application subscriptions may overlap; this is connection-level evidence.',
    })
    for (const frame of pendingFrames) processFrame(frame)
    pendingFrames.length = 0
    if (!active) return handle
    waitTimer = ready
      ? undefined
      : setTimeout(
          () => finish('timeout'),
          Math.max(0, waitMs - (now() - dispatchedAt)),
        )
    budgetTimer = setTimeout(
      () => finish('budget'),
      Math.max(0, PLAYGROUND_LIMITS.observationMs - (now() - dispatchedAt)),
    )
  } catch (error) {
    emit({
      kind: 'local-error',
      at: now(),
      message:
        error instanceof Error
          ? error.message
          : 'Publication capability unavailable.',
    })
    finish('disposed')
  }
  return handle
}

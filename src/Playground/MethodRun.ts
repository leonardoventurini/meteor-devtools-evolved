import type { EncodedValue } from './Values'

export type MethodPhase =
  | 'queued'
  | 'running'
  | 'settled'
  | 'stopped'
  | 'timed-out'
  | 'interrupted'
  | 'local-error'

export interface MethodRun {
  phase: MethodPhase
  createdAt: number
  invokedAt?: number
  dispatchedAt?: number
  methodId?: string
  resultSeen: boolean
  resultAt?: number
  result?: EncodedValue
  error?: EncodedValue
  writesReflected: boolean
  writesAt?: number
  outcome: 'pending' | 'success' | 'error' | 'unknown'
  serverElapsedMs?: number
  endedAt?: number
  message?: string
  lateEvidence: boolean
}

export type MethodSignal =
  | { kind: 'invoke'; at: number }
  | { kind: 'dispatch'; at: number; methodId: string }
  | { kind: 'result'; at: number; result?: EncodedValue; error?: EncodedValue }
  | { kind: 'updated' | 'timeout' | 'stop' | 'disconnect'; at: number }
  | { kind: 'local-error'; at: number; message: string }

export const createMethodRun = (at: number): MethodRun => ({
  phase: 'queued',
  createdAt: at,
  resultSeen: false,
  writesReflected: false,
  outcome: 'pending',
  lateEvidence: false,
})

const stoppedPhases = new Set<MethodPhase>([
  'stopped',
  'timed-out',
  'interrupted',
  'local-error',
])

/**
 * Server result and writes-reflected signals are independent. A successful run
 * settles when both arrive; a server error is known immediately. Local waiting
 * can end earlier without cancelling server effects. Later evidence enriches
 * that same record but never reopens scheduling or rewrites its stop boundary.
 * Callers must correlate connection and method identity before reducing signals.
 */
export const reduceMethodRun = (
  run: MethodRun,
  signal: MethodSignal,
): MethodRun => {
  if (signal.kind === 'invoke') {
    if (run.phase !== 'queued' || run.invokedAt !== undefined) {
      throw new Error('Cannot invoke a method run twice or after stopping.')
    }
    return { ...run, phase: 'running', invokedAt: signal.at }
  }
  if (signal.kind === 'dispatch') {
    const lateDispatch =
      stoppedPhases.has(run.phase) && run.invokedAt !== undefined
    if (
      run.methodId !== undefined ||
      run.phase === 'local-error' ||
      (run.phase !== 'queued' && run.invokedAt === undefined)
    ) {
      throw new Error('Cannot dispatch a method run twice or after stopping.')
    }
    return {
      ...run,
      phase: lateDispatch ? run.phase : 'running',
      invokedAt: run.invokedAt ?? signal.at,
      methodId: signal.methodId,
      dispatchedAt: signal.at,
      lateEvidence: run.lateEvidence || lateDispatch,
    }
  }

  const stopped = stoppedPhases.has(run.phase)
  if (signal.kind === 'result' || signal.kind === 'updated') {
    if (run.dispatchedAt === undefined) {
      throw new Error('Method evidence requires a recorded dispatch.')
    }
    if (signal.kind === 'result' ? run.resultSeen : run.writesReflected)
      return run
    const next: MethodRun =
      signal.kind === 'result'
        ? {
            ...run,
            resultSeen: true,
            resultAt: signal.at,
            ...(Object.hasOwn(signal, 'result')
              ? { result: signal.result }
              : {}),
            ...(Object.hasOwn(signal, 'error') ? { error: signal.error } : {}),
            outcome: signal.error === undefined ? 'success' : 'error',
            serverElapsedMs: Math.max(0, signal.at - run.dispatchedAt),
          }
        : { ...run, writesReflected: true, writesAt: signal.at }

    if (stopped) return { ...next, lateEvidence: true }
    if (next.outcome === 'error' || (next.resultSeen && next.writesReflected)) {
      return { ...next, phase: 'settled', endedAt: run.endedAt ?? signal.at }
    }
    return next
  }
  if (stopped || run.phase === 'settled') return run

  const phases = {
    timeout: 'timed-out',
    stop: 'stopped',
    disconnect: 'interrupted',
    'local-error': 'local-error',
  } as const
  const phase = phases[signal.kind]

  return {
    ...run,
    phase,
    endedAt: signal.at,
    outcome: run.resultSeen ? run.outcome : 'unknown',
    ...(signal.kind === 'local-error' ? { message: signal.message } : {}),
  }
}

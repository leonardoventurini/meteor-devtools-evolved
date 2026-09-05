import { PLAYGROUND_LIMITS } from './Limits'
import type { MatrixVariant } from './Matrix'

export type MatrixStatus =
  | 'success'
  | 'error'
  | 'assertion-failed'
  | 'timeout'
  | 'interrupted'
  | 'limit-exceeded'
  | 'inconclusive'
  | 'stopped'
export interface MatrixOutcome {
  status: MatrixStatus
}
export interface MatrixSummary<T extends MatrixOutcome> {
  outcomes: T[]
  reason: 'completed' | MatrixStatus
  total: number
  started: number
}
export interface MatrixExecution<T extends MatrixOutcome> {
  /**
   * Resolve only after releasing the subscription handle and owned connection.
   * The scheduler waits for this cleanup before dispatching the next variant.
   */
  result: Promise<T>
  stop(): void
}
export interface MatrixSchedulerOptions<T extends MatrixOutcome> {
  execute(variant: MatrixVariant, index: number): MatrixExecution<T>
  contextValid?(): boolean
  onProgress?(progress: MatrixSummary<T>): void
}

/**
 * One execution per scheduler, with an independent elapsed deadline. A stop
 * resolves local waiting even when a Meteor invocation cannot be cancelled.
 * Late settlements have no continuation path and are retained by the runner.
 */
export class MatrixScheduler<T extends MatrixOutcome> {
  private cancel: ((reason: MatrixStatus) => void) | undefined
  constructor(private readonly options: MatrixSchedulerOptions<T>) {}
  get running(): boolean {
    return this.cancel !== undefined
  }
  stop(reason: MatrixStatus = 'stopped'): void {
    this.cancel?.(reason)
  }

  async start(
    variants: readonly MatrixVariant[],
    options: { delayMs?: number; continueOnError?: boolean } = {},
  ): Promise<MatrixSummary<T>> {
    if (this.running) throw new Error('A matrix is already running.')
    const delayMs = options.delayMs ?? PLAYGROUND_LIMITS.matrixDelayMs
    if (
      !Number.isInteger(delayMs) ||
      delayMs < PLAYGROUND_LIMITS.minMatrixDelayMs ||
      delayMs > PLAYGROUND_LIMITS.maxMatrixDelayMs
    )
      throw new TypeError('Matrix delay must be between 100 and 5000 ms.')
    if (
      variants.length === 0 ||
      variants.length > PLAYGROUND_LIMITS.matrixVariants
    )
      throw new TypeError('A matrix requires 1 to 20 reviewed variants.')
    const plan = structuredClone(variants)
    const summary: MatrixSummary<T> = {
      outcomes: [],
      reason: 'completed',
      total: plan.length,
      started: 0,
    }
    let active: MatrixExecution<T> | undefined
    let cancelled: MatrixStatus | undefined
    let signal!: (reason: MatrixStatus) => void
    let delayTimer: ReturnType<typeof setTimeout> | undefined
    const cancellation = new Promise<MatrixStatus>(resolve => {
      signal = resolve
    })
    this.cancel = reason => {
      if (cancelled) return
      cancelled = reason
      signal(reason)
      try {
        active?.stop()
      } catch {
        /* Cleanup failure cannot resume a stopped matrix. */
      }
    }
    const deadline = setTimeout(
      () => this.stop('timeout'),
      PLAYGROUND_LIMITS.matrixDurationMs,
    )
    const emit = () =>
      this.options.onProgress?.({ ...summary, outcomes: [...summary.outcomes] })
    try {
      for (const [index, variant] of plan.entries()) {
        if (cancelled) break
        if (this.options.contextValid && !this.options.contextValid()) {
          this.stop('interrupted')
          break
        }
        summary.started += 1
        active = this.options.execute(variant, index)
        emit()
        const outcome = await Promise.race([
          active.result.then(value => ({ kind: 'result' as const, value })),
          cancellation.then(reason => ({ kind: 'cancel' as const, reason })),
        ])
        if (outcome.kind === 'cancel' || cancelled) break
        active = undefined
        summary.outcomes.push(outcome.value)
        const { status } = outcome.value
        emit()
        if (
          status !== 'success' &&
          !(
            options.continueOnError &&
            (status === 'error' || status === 'assertion-failed')
          )
        ) {
          summary.reason = status
          break
        }
        if (index < plan.length - 1) {
          await Promise.race([
            new Promise<void>(resolve => {
              delayTimer = setTimeout(resolve, delayMs)
            }),
            cancellation,
          ])
          clearTimeout(delayTimer)
        }
      }
    } catch {
      this.stop('interrupted')
    } finally {
      clearTimeout(deadline)
      clearTimeout(delayTimer)
      this.cancel = undefined
    }
    if (cancelled) summary.reason = cancelled
    emit()
    return summary
  }
}

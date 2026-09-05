import type { RunCommand } from './Commands'
import { PLAYGROUND_LIMITS } from './Limits'

interface ActiveSession {
  id: string
  expiresAt: number
  requests: Set<string>
}

/**
 * Page-local lifecycle and duplicate-execution boundary. IDs are never evicted
 * while a session can execute. Retired session IDs cannot reopen; refreshing the
 * page creates a new epoch when the finite tombstone budget is exhausted.
 * This is not an authentication boundary against the inspected page itself.
 */
export class SessionLedger {
  private active: ActiveSession | undefined
  private readonly retired = new Set<string>()

  constructor(
    private readonly pageEpoch: string,
    private readonly now: () => number = Date.now,
    private readonly onRetire: (id: string) => void = () => {},
  ) {}

  open(id: string, epoch: string): void {
    this.assertEpoch(epoch)
    this.expire()
    if (this.retired.has(id)) throw new Error('This panel session is retired.')
    if (this.active?.id === id) {
      this.renew(id, epoch)
      return
    }
    if (this.retired.size >= PLAYGROUND_LIMITS.requestLedger) {
      throw new Error('Panel session limit reached; reload the inspected page.')
    }
    this.retire()
    this.active = {
      id,
      expiresAt: this.now() + PLAYGROUND_LIMITS.leaseDurationMs,
      requests: new Set(),
    }
  }

  renew(id: string, epoch: string): void {
    this.requireActive(id, epoch).expiresAt =
      this.now() + PLAYGROUND_LIMITS.leaseDurationMs
  }

  close(id: string, epoch: string): void {
    this.requireActive(id, epoch)
    this.retire()
  }

  accept(command: RunCommand): 'new' | 'duplicate' {
    const session = this.requireActive(
      command.panelSessionId,
      command.pageEpoch,
    )
    if (session.requests.has(command.requestId)) return 'duplicate'
    if (session.requests.size >= PLAYGROUND_LIMITS.requestLedger) {
      throw new Error('Request ID limit reached; reset the playground session.')
    }
    session.requests.add(command.requestId)
    return 'new'
  }

  assertActive(id: string, epoch: string): void {
    this.requireActive(id, epoch)
  }

  expire(): boolean {
    if (this.active && this.now() >= this.active.expiresAt) {
      this.retire()
      return true
    }
    return false
  }

  private assertEpoch(epoch: string): void {
    if (epoch !== this.pageEpoch) throw new Error('Stale inspected page epoch.')
  }

  private requireActive(id: string, epoch: string): ActiveSession {
    this.assertEpoch(epoch)
    if (this.expire()) throw new Error('The playground session expired.')
    if (!this.active || this.active.id !== id) {
      throw new Error('No matching active playground session.')
    }
    return this.active
  }

  private retire(): void {
    const previous = this.active
    if (!previous) return
    this.active = undefined
    this.retired.add(previous.id)
    this.onRetire(previous.id)
  }
}

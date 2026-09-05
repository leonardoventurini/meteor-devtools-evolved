import type { RunCommand } from './Commands'
import type { EvidenceSnapshot } from './Evidence'
import type { MethodPhase, MethodRun } from './MethodRun'
import type { EncodedValue } from './Values'

export interface AuthenticationObservation {
  state: 'anonymous' | 'authenticated' | 'unknown'
  userId?: EncodedValue
  observedAt: number
  provenance: string
}
export interface RunRecord {
  request: RunCommand
  sequence: number
  startedAt: number
  updatedAt: number
  phase:
    MethodPhase | 'connecting' | 'authenticating' | 'ready' | 'limit-exceeded'
  finished: boolean
  endpointLabel: string
  authentication: AuthenticationObservation
  evidence: EvidenceSnapshot
  method?: MethodRun
  baseline?: EvidenceSnapshot
  readiness?: EvidenceSnapshot
  reasons: string[]
  subscriptionId?: string
}
export type RunnerEvent =
  | { kind: 'hello'; pageEpoch: string }
  | { kind: 'session'; panelSessionId: string; pageEpoch: string }
  | { kind: 'run'; record: RunRecord }
  | {
      kind: 'error'
      panelSessionId?: string
      requestId?: string
      message: string
    }

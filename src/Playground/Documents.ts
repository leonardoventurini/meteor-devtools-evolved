import type { EvidenceSnapshot } from './Evidence'
import { PLAYGROUND_LIMITS } from './Limits'
import { serializedBytes, validateValue, type EncodedValue } from './Values'

export type DocumentSnapshot = Record<
  string,
  Record<string, Record<string, EncodedValue>>
>
interface CaptureLimits {
  frames: number
  bytes: number
  documents: number
}
const escape = (key: string) => key.replaceAll('~', '~0').replaceAll('/', '~1')
const object = (value: unknown): value is Record<string, EncodedValue> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const DATA_MESSAGES = new Set(['added', 'changed', 'removed'])
const CONTROL_MESSAGES = new Set([
  'ping',
  'pong',
  'connected',
  'failed',
  'ready',
  'nosub',
  'result',
  'updated',
])

/**
 * Reduces connection-level wire evidence. Full documents are known only from an
 * explicit baseline or added frame; changed fields never manufacture a baseline.
 * All externally supplied keys remain own properties on null-prototype maps.
 */
export class PublicationDocuments {
  private documents: DocumentSnapshot = Object.create(null) as DocumentSnapshot
  private paths = new Set<string>()
  private baseline: 'known' | 'unknown'
  private frames = 0
  private bytes = 0
  private count = 0
  truncated = false
  readonly reasons: string[] = []
  constructor(
    baseline?: DocumentSnapshot,
    private readonly limits: CaptureLimits = {
      frames: PLAYGROUND_LIMITS.runFrames,
      bytes: PLAYGROUND_LIMITS.runBytes,
      documents: PLAYGROUND_LIMITS.documents,
    },
  ) {
    this.baseline = baseline ? 'known' : 'unknown'
    if (baseline) {
      validateValue(baseline)
      for (const [collection, documents] of Object.entries(baseline)) {
        for (const [id, fields] of Object.entries(documents))
          this.observe(JSON.stringify({ msg: 'added', collection, id, fields }))
      }
    }
  }
  incomplete(reason: string): void {
    if (!this.reasons.includes(reason)) this.reasons.push(reason)
    this.baseline = 'unknown'
    this.paths.clear()
  }
  private truncate(reason: string): void {
    this.truncated = true
    this.incomplete(reason)
  }
  observe(raw: string): void {
    if (this.truncated) return
    this.frames += 1
    this.bytes += serializedBytes(raw)
    if (this.frames > this.limits.frames || this.bytes > this.limits.bytes) {
      this.truncate('Publication capture frame or byte limit reached.')
      return
    }
    let frame: unknown
    try {
      frame = JSON.parse(raw) as unknown
      validateValue(frame)
    } catch {
      this.incomplete('Unrecognized publication transport evidence.')
      return
    }
    if (!object(frame) || typeof frame.msg !== 'string') {
      this.incomplete('Unrecognized publication transport evidence.')
      return
    }
    if (CONTROL_MESSAGES.has(frame.msg)) return
    if (!DATA_MESSAGES.has(frame.msg)) {
      this.incomplete('Unsupported message may affect document state.')
      return
    }
    const { collection, id, fields, cleared } = frame
    if (
      typeof collection !== 'string' ||
      typeof id !== 'string' ||
      (fields !== undefined && !object(fields)) ||
      (cleared !== undefined &&
        (!Array.isArray(cleared) ||
          cleared.some(key => typeof key !== 'string')))
    ) {
      this.incomplete('Malformed publication document message.')
      return
    }
    const path = `/documents/${escape(collection)}/${escape(id)}`
    const invalidate = () => {
      for (const known of this.paths)
        if (known === path || known.startsWith(`${path}/`))
          this.paths.delete(known)
    }
    let documents = this.documents[collection]
    if (frame.msg === 'removed') {
      if (documents && Object.hasOwn(documents, id)) {
        delete documents[id]
        this.count -= 1
      }
      invalidate()
      return
    }
    if (!documents) {
      documents = Object.create(null) as Record<
        string,
        Record<string, EncodedValue>
      >
      this.documents[collection] = documents
    }
    if (!Object.hasOwn(documents, id)) {
      if (this.count >= this.limits.documents) {
        this.truncate('Publication document limit reached.')
        return
      }
      this.count += 1
      documents[id] = Object.create(null) as Record<string, EncodedValue>
    }
    if (frame.msg === 'added') {
      documents[id] = Object.create(null) as Record<string, EncodedValue>
      invalidate()
      this.paths.add(path)
    }
    const document = documents[id]!
    if (object(fields))
      for (const [key, value] of Object.entries(fields)) {
        document[key] = value
        this.paths.add(`${path}/${escape(key)}`)
      }
    if (Array.isArray(cleared))
      for (const key of cleared)
        if (typeof key === 'string') {
          delete document[key]
          this.paths.delete(`${path}/${escape(key)}`)
        }
  }
  /**
   * Copies the wire-keyed state for a pre-subscription baseline handoff. Callers
   * must check snapshot completeness and truncation before treating it as known.
   */
  rawDocumentSnapshot(): DocumentSnapshot {
    return structuredClone(this.documents)
  }
  snapshot(
    outcome: EvidenceSnapshot['outcome'],
    boundary?: EvidenceSnapshot['boundary'],
  ): EvidenceSnapshot {
    return {
      data: {
        documents: structuredClone(this.documents),
      },
      completePaths:
        this.baseline === 'known' && !this.truncated
          ? ['/documents']
          : [...this.paths],
      redactedPaths: [],
      truncated: this.truncated,
      documentBaseline: this.baseline,
      outcome,
      ...(boundary ? { boundary } : {}),
    }
  }
}

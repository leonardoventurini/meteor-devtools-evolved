import type { OperationKind } from './Commands'
import { PLAYGROUND_LIMITS } from './Limits'
import {
  canonicalValue,
  parseParameters,
  serializedBytes,
  type EncodedValue,
} from './Values'

export const CATALOG_SAMPLE_BYTES = 4096
export type CatalogProvenance = 'application' | 'playground'
export interface CatalogObservation {
  pageEpoch: string
  connectionId: string
  kind: OperationKind
  name: string
  parameters: EncodedValue[]
  provenance: CatalogProvenance
  internal?: boolean
  time?: number
}
export interface CatalogEntry {
  kind: OperationKind
  name: string
  count: number
  applicationCount: number
  playgroundCount: number
  lastSeen: number
  examples: {
    parameters: EncodedValue[]
    provenance: CatalogProvenance
    time: number
  }[]
  examplesOmitted: number
}

/**
 * Explicit observation scopes prevent cross-page and cross-connection discovery.
 * Internal authentication/heartbeat traffic must be marked before observation;
 * endpoint names alone cannot identify private application protocol methods.
 */
export class EndpointCatalog {
  private readonly pages = new Map<
    string,
    Map<string, Map<string, CatalogEntry>>
  >()

  observe(observation: CatalogObservation): void {
    if (observation.internal) return
    const { pageEpoch, connectionId, kind, name, provenance } = observation
    if (!name.trim() || name.length > 256) return
    const time = observation.time ?? Date.now()
    let connections = this.pages.get(pageEpoch)
    if (!connections) {
      connections = new Map()
      this.pages.set(pageEpoch, connections)
    }
    let entries = connections.get(connectionId)
    if (!entries) {
      entries = new Map()
      connections.set(connectionId, entries)
    }
    const key = JSON.stringify([kind, name])
    const entry = entries.get(key) ?? {
      kind,
      name,
      count: 0,
      applicationCount: 0,
      playgroundCount: 0,
      lastSeen: time,
      examples: [],
      examplesOmitted: 0,
    }
    entry.count += 1
    if (provenance === 'application') entry.applicationCount += 1
    else entry.playgroundCount += 1
    entry.lastSeen = time
    try {
      const encoded = canonicalValue(observation.parameters)
      if (serializedBytes(encoded) > CATALOG_SAMPLE_BYTES)
        entry.examplesOmitted += 1
      else {
        entry.examples = entry.examples.filter(
          example => canonicalValue(example.parameters) !== encoded,
        )
        entry.examples.unshift({
          parameters: parseParameters(encoded),
          provenance,
          time,
        })
        entry.examples.length = Math.min(
          entry.examples.length,
          PLAYGROUND_LIMITS.catalogExamples,
        )
      }
    } catch {
      entry.examplesOmitted += 1
    }
    entries.delete(key)
    entries.set(key, entry)
    if (entries.size > PLAYGROUND_LIMITS.catalogNames) {
      const oldest = entries.keys().next().value
      if (oldest !== undefined) entries.delete(oldest)
    }
  }

  entries(pageEpoch: string, connectionId: string): CatalogEntry[] {
    return structuredClone([
      ...(this.pages.get(pageEpoch)?.get(connectionId)?.values() ?? []),
    ])
  }

  clear(pageEpoch?: string, connectionId?: string): void {
    if (pageEpoch === undefined) this.pages.clear()
    else if (connectionId === undefined) this.pages.delete(pageEpoch)
    else {
      const connections = this.pages.get(pageEpoch)
      connections?.delete(connectionId)
      if (connections?.size === 0) this.pages.delete(pageEpoch)
    }
  }
}

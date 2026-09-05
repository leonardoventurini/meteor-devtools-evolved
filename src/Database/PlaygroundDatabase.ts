import Dexie from 'dexie'
import { PLAYGROUND_LIMITS } from '../Playground/Limits'
import {
  parseCase,
  parseSnapshot,
  previewExport,
  remapImport,
  type PlaygroundFile,
  type SavedCase,
  type SavedSnapshot,
} from '../Playground/Records'
import { serializedBytes } from '../Playground/Values'

export const PLAYGROUND_DATABASE_NAME = 'MeteorToolsPlaygroundDatabase'
export interface StoredRecords<T> {
  records: T[]
  errors: { id: string; error: string }[]
}
/**
 * Additive local storage, opened on explicit access. Every mutation includes both
 * tables in one read/write transaction, serializing quota checks across panels.
 * Snapshots use add-only semantics; a later observation must receive a new ID.
 */
export class PlaygroundDatabase extends Dexie {
  readonly cases: Dexie.Table<SavedCase, string>
  readonly snapshots: Dexie.Table<SavedSnapshot, string>
  constructor(name = PLAYGROUND_DATABASE_NAME) {
    super(name)
    this.version(1).stores({
      cases: 'id, updatedAt, title',
      snapshots: 'id, capturedAt, caseId',
    })
    this.cases = this.table('cases')
    this.snapshots = this.table('snapshots')
  }
  private async enforceQuota(): Promise<void> {
    const cases = await this.cases.toArray(),
      snapshots = await this.snapshots.toArray()
    if (
      cases.length > PLAYGROUND_LIMITS.savedCases ||
      snapshots.length > PLAYGROUND_LIMITS.savedSnapshots
    )
      throw new Error(
        'Saved record limit exceeded; delete or export existing records.',
      )
    const bytes = [...cases, ...snapshots].reduce(
      (sum, item) => sum + serializedBytes(JSON.stringify(item)),
      0,
    )
    if (bytes > PLAYGROUND_LIMITS.storageBytes)
      throw new Error(
        'Saved storage exceeds 20 MiB; delete or export existing records.',
      )
  }
  async saveCase(input: SavedCase): Promise<SavedCase> {
    const record = previewExport([parseCase(input)], [], {}).cases[0]!
    return this.transaction('rw', this.cases, this.snapshots, async () => {
      const existing = await this.cases.get(record.id)
      if (existing) {
        const previous = parseCase(existing)
        if (
          record.revision !== previous.revision + 1 ||
          record.createdAt !== previous.createdAt
        )
          throw new Error(
            'Case revision conflict; reload the saved case before editing.',
          )
      } else if (record.revision !== 1)
        throw new Error('New cases must start at revision 1.')
      await this.cases.put(record)
      await this.enforceQuota()
      return record
    })
  }
  async saveSnapshot(input: SavedSnapshot): Promise<SavedSnapshot> {
    const record = previewExport([], [parseSnapshot(input)], {}).snapshots[0]!
    return this.transaction('rw', this.cases, this.snapshots, async () => {
      await this.snapshots.add(record)
      await this.enforceQuota()
      return record
    })
  }
  async importReviewed(file: PlaygroundFile): Promise<PlaygroundFile> {
    const records = remapImport(file)
    const sanitized = previewExport(
      records.cases,
      records.snapshots,
      {},
      records.exportedAt,
    )
    return this.transaction('rw', this.cases, this.snapshots, async () => {
      await this.cases.bulkAdd(sanitized.cases)
      await this.snapshots.bulkAdd(sanitized.snapshots)
      await this.enforceQuota()
      return sanitized
    })
  }
  async readCases(): Promise<StoredRecords<SavedCase>> {
    if (!this.isOpen() && !(await Dexie.exists(this.name)))
      return { records: [], errors: [] }
    return this.readRecords(await this.cases.toArray(), parseCase)
  }
  async readSnapshots(): Promise<StoredRecords<SavedSnapshot>> {
    if (!this.isOpen() && !(await Dexie.exists(this.name)))
      return { records: [], errors: [] }
    return this.readRecords(await this.snapshots.toArray(), parseSnapshot)
  }
  private readRecords<T extends { id: string }>(
    inputs: unknown[],
    parse: (input: unknown) => T,
  ): StoredRecords<T> {
    const records: T[] = [],
      errors: { id: string; error: string }[] = []
    for (const [index, input] of inputs.entries()) {
      try {
        records.push(parse(input))
      } catch (error) {
        const descriptor =
          input !== null && typeof input === 'object'
            ? Object.getOwnPropertyDescriptor(input, 'id')
            : undefined
        const id: unknown =
          descriptor && 'value' in descriptor ? descriptor.value : undefined
        errors.push({
          id: typeof id === 'string' ? id : `record ${index + 1}`,
          error:
            error instanceof Error ? error.message : 'Invalid saved record.',
        })
      }
    }
    return { records, errors }
  }
  async deleteCase(id: string): Promise<void> {
    await this.cases.delete(id)
  }
  async deleteSnapshot(id: string): Promise<void> {
    await this.snapshots.delete(id)
  }
}

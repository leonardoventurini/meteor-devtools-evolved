import { describe, expect, it, vi } from 'vitest'
import {
  DDP_HISTORY_POLICY_STORAGE_KEY,
  DDPHistoryPolicy,
  getDDPHistoryPolicy,
  setDDPHistoryPolicy,
  type ExtensionStorageArea,
} from '../src/Browser/DDPHistoryPolicy'

const createStorage = (
  storedValue?: unknown,
): ExtensionStorageArea & { set: ReturnType<typeof vi.fn> } => ({
  get: vi.fn().mockResolvedValue({
    [DDP_HISTORY_POLICY_STORAGE_KEY]: storedValue,
  }),
  set: vi.fn().mockResolvedValue(),
})

describe('DDP history policy', () => {
  it.each(['unexpected', 42])(
    'defaults invalid stored value %j to captured history',
    async storedValue => {
      const storage = createStorage(storedValue)

      await expect(getDDPHistoryPolicy(storage)).resolves.toBe(
        DDPHistoryPolicy.SHOW_HISTORY,
      )
    },
  )

  it('defaults a missing stored value to captured history', async () => {
    const storage = createStorage()

    await expect(getDDPHistoryPolicy(storage)).resolves.toBe(
      DDPHistoryPolicy.SHOW_HISTORY,
    )
  })

  it.each(Object.values(DDPHistoryPolicy))(
    'returns the stored %s policy',
    async policy => {
      const storage = createStorage(policy)

      await expect(getDDPHistoryPolicy(storage)).resolves.toBe(policy)
    },
  )

  it('falls back to captured history when storage is unreadable', async () => {
    const storage = createStorage()
    vi.mocked(storage.get).mockRejectedValue(new Error('Storage unavailable'))

    await expect(getDDPHistoryPolicy(storage)).resolves.toBe(
      DDPHistoryPolicy.SHOW_HISTORY,
    )
  })

  it('persists a selected policy under the stable storage key', async () => {
    const storage = createStorage()

    await setDDPHistoryPolicy(DDPHistoryPolicy.START_FROM_NOW, storage)

    expect(storage.set).toHaveBeenCalledWith({
      [DDP_HISTORY_POLICY_STORAGE_KEY]: DDPHistoryPolicy.START_FROM_NOW,
    })
  })
})

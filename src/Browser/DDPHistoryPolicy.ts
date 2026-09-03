import { browser } from 'wxt/browser'

export const DDP_HISTORY_POLICY_STORAGE_KEY = 'ddpHistoryPolicy'

export enum DDPHistoryPolicy {
  SHOW_HISTORY = 'show-history',
  START_FROM_NOW = 'start-from-now',
}

export interface ExtensionStorageArea {
  get(key: string): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
}

const isDDPHistoryPolicy = (value: unknown): value is DDPHistoryPolicy =>
  Object.values(DDPHistoryPolicy).includes(value as DDPHistoryPolicy)

/**
 * Reads the cross-context startup policy while preserving history whenever
 * storage is missing, invalid, or temporarily unavailable.
 */
export const getDDPHistoryPolicy = async (
  storage: ExtensionStorageArea = browser.storage.local,
): Promise<DDPHistoryPolicy> => {
  try {
    const settings = await storage.get(DDP_HISTORY_POLICY_STORAGE_KEY)
    const policy = settings[DDP_HISTORY_POLICY_STORAGE_KEY]

    return isDDPHistoryPolicy(policy) ? policy : DDPHistoryPolicy.SHOW_HISTORY
  } catch (error) {
    console.warn('Unable to read the DDP history policy.', error)

    return DDPHistoryPolicy.SHOW_HISTORY
  }
}

export const setDDPHistoryPolicy = (
  policy: DDPHistoryPolicy,
  storage: ExtensionStorageArea = browser.storage.local,
): Promise<void> =>
  storage.set({
    [DDP_HISTORY_POLICY_STORAGE_KEY]: policy,
  })

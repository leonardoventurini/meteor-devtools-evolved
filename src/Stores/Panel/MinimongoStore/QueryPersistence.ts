import type { MinimongoQueryInput } from '@/Utils/MinimongoQuery'
import { browser } from 'wxt/browser'

const QUERY_STORAGE_KEY_PREFIX = 'meteor-devtools:minimongo-query:v1:'

export interface QueryStorage {
  getItem(key: string): string | null
  removeItem(key: string): void
  setItem(key: string, value: string): void
}

export interface PersistedMinimongoQueryState {
  appliedInput: MinimongoQueryInput | null
  draftInput: MinimongoQueryInput
}

const isQueryInput = (value: unknown): value is MinimongoQueryInput => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const input = value as Record<keyof MinimongoQueryInput, unknown>

  return (
    typeof input.limit === 'string' &&
    typeof input.projection === 'string' &&
    typeof input.selector === 'string' &&
    typeof input.sort === 'string'
  )
}

export const getDefaultQueryScope = (): string => {
  try {
    return `tab-${browser.devtools.inspectedWindow.tabId}`
  } catch {
    return 'panel'
  }
}

export const getQueryStorageKey = (scope: string, connectionId: string) =>
  `${QUERY_STORAGE_KEY_PREFIX}${encodeURIComponent(scope)}:${encodeURIComponent(connectionId)}`

export const getQueryStorage = (): QueryStorage | null => {
  try {
    return globalThis.window === undefined
      ? null
      : globalThis.window.localStorage
  } catch {
    return null
  }
}

export const loadQueryState = (
  storage: QueryStorage | null,
  scope: string,
  connectionId: string,
): PersistedMinimongoQueryState | null => {
  if (!storage) return null

  try {
    const source = storage.getItem(getQueryStorageKey(scope, connectionId))
    if (!source) return null

    const value: unknown = JSON.parse(source)
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return null
    }

    const state = value as Record<string, unknown>
    const draftInput = state.draftInput
    if (!isQueryInput(draftInput)) return null

    let appliedInput: MinimongoQueryInput | null
    if (state.appliedInput === null) {
      appliedInput = null
    } else if (isQueryInput(state.appliedInput)) {
      appliedInput = state.appliedInput
    } else {
      return null
    }

    return {
      appliedInput,
      draftInput,
    }
  } catch {
    return null
  }
}

export const saveQueryState = (
  storage: QueryStorage | null,
  scope: string,
  connectionId: string,
  state: PersistedMinimongoQueryState,
): void => {
  if (!storage) return

  try {
    storage.setItem(
      getQueryStorageKey(scope, connectionId),
      JSON.stringify(state),
    )
  } catch {
    // Querying remains available when local storage is disabled or full.
  }
}

export const removeQueryState = (
  storage: QueryStorage | null,
  scope: string,
  connectionId: string,
): void => {
  if (!storage) return

  try {
    storage.removeItem(getQueryStorageKey(scope, connectionId))
  } catch {
    // Clearing in-memory state must not depend on storage availability.
  }
}

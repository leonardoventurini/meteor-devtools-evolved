import { DDPHistoryPolicy } from './DDPHistoryPolicy'

const DEFAULT_BACKGROUND_CACHE_LIMIT = 10_000

type PostMessage = (message: unknown) => void

export class BackgroundMessageCache {
  private readonly entries = new Map<number, unknown[]>()

  constructor(
    private readonly limit: number = DEFAULT_BACKGROUND_CACHE_LIMIT,
  ) {}

  push(tabId: number, message: unknown): void {
    const entries = this.entries.get(tabId) ?? []

    entries.push(message)

    if (entries.length > this.limit) entries.shift()

    this.entries.set(tabId, entries)
  }

  get(tabId: number): unknown[] {
    return [...(this.entries.get(tabId) ?? [])]
  }

  clear(tabId: number): void {
    this.entries.delete(tabId)
  }

  initializePanel(
    tabId: number,
    policy: DDPHistoryPolicy,
    postMessage: PostMessage,
  ): void {
    if (policy === DDPHistoryPolicy.START_FROM_NOW) {
      this.clear(tabId)
      return
    }

    for (const message of this.get(tabId)) postMessage(message)
  }
}

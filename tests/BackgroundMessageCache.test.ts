import { describe, expect, it, vi } from 'vitest'
import { BackgroundMessageCache } from '../src/Browser/BackgroundMessageCache'
import { DDPHistoryPolicy } from '../src/Browser/DDPHistoryPolicy'

const message = (id: string): Message<{ id: string }> => ({
  eventType: 'ddp-event',
  data: { id },
})

describe('background message cache', () => {
  it('does not duplicate leased playground records in ordinary capture history', () => {
    const cache = new BackgroundMessageCache()
    cache.push(1, {
      eventType: 'playground:event',
      data: { kind: 'run', record: { private: true } },
    })
    expect(cache.get(1)).toEqual([])
  })
  it('replays captured messages in capture order', () => {
    const cache = new BackgroundMessageCache()
    const postMessage = vi.fn()

    for (const id of ['first', 'second']) cache.push(1, message(id))
    cache.initializePanel(1, DDPHistoryPolicy.SHOW_HISTORY, postMessage)

    expect(postMessage.mock.calls.map(([entry]) => entry.data.id)).toEqual([
      'first',
      'second',
    ])
  })

  it('discards the inspected tab history when starting from now', () => {
    const cache = new BackgroundMessageCache()
    const postMessage = vi.fn()

    for (const [tabId, id] of [
      [1, 'discarded'],
      [2, 'other-tab'],
    ] as const) {
      cache.push(tabId, message(id))
    }
    cache.initializePanel(1, DDPHistoryPolicy.START_FROM_NOW, postMessage)

    expect(postMessage).not.toHaveBeenCalled()
    expect(cache.get(1)).toEqual([])
    expect(cache.get(2)).toEqual([message('other-tab')])
  })

  it('retains the first message captured after the start-from-now cutoff', () => {
    const cache = new BackgroundMessageCache()
    const postMessage = vi.fn()

    cache.push(1, message('discarded'))
    cache.initializePanel(1, DDPHistoryPolicy.START_FROM_NOW, postMessage)
    cache.push(1, message('live'))

    expect(cache.get(1)).toEqual([message('live')])
  })

  it('bounds each tab cache to the configured newest messages', () => {
    const cache = new BackgroundMessageCache(2)

    for (const id of ['first', 'second', 'third']) cache.push(1, message(id))

    expect(cache.get(1)).toEqual([message('second'), message('third')])
  })
})

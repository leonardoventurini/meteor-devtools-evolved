import { afterEach, expect, it, vi } from 'vitest'
import { getSubscriptions } from '../src/Browser/MeteorLibrary'

afterEach(() => vi.unstubAllGlobals())

it('preserves encoded EJSON parameters separately from legacy subscription display', () => {
  vi.stubGlobal('EJSON', {
    fromJSONValue: (value: unknown) => value,
    toJSONValue: (value: unknown) =>
      Array.isArray(value)
        ? value.map(item =>
            item instanceof Date ? { $date: item.getTime() } : item,
          )
        : value,
  })
  vi.stubGlobal('Tracker', { nonreactive: <T>(action: () => T) => action() })
  const connection = {
    _stream: { send: vi.fn(), on: vi.fn() },
    _subscriptions: {
      own: {
        id: 'own',
        name: 'example',
        params: [new Date(42)],
        inactive: false,
        ready: true,
      },
    },
  }
  const subscriptions = JSON.parse(getSubscriptions(connection)) as Record<
    string,
    IMeteorSubscription
  >
  expect(subscriptions.own?.playgroundParameters).toEqual([{ $date: 42 }])
})

it('marks unavailable native encoding instead of inventing runnable parameters', () => {
  vi.stubGlobal('EJSON', null)
  vi.stubGlobal('Package', null)
  const connection = {
    _stream: { send: vi.fn(), on: vi.fn() },
    _subscriptions: {
      own: {
        id: 'own',
        name: 'example',
        params: [new Date(42)],
        inactive: false,
        ready: true,
      },
    },
  }
  const subscriptions = JSON.parse(getSubscriptions(connection)) as Record<
    string,
    IMeteorSubscription
  >
  expect(subscriptions.own?.playgroundParameters).toBeUndefined()
  expect(subscriptions.own?.playgroundParametersError).toContain('unavailable')
})

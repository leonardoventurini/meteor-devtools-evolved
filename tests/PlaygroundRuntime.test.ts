import { expect, it } from 'vitest'
import { resolveRuntimeCapabilities } from '../src/Injectors/Playground/RuntimeCapabilities'

it('resolves Meteor package codecs and Tracker without evaluating editor input', () => {
  const runtime = resolveRuntimeCapabilities({
    Package: {
      ejson: {
        EJSON: {
          fromJSONValue: (value: unknown) => value,
          toJSONValue: (value: unknown) => value,
        },
      },
      tracker: { Tracker: { nonreactive: <T>(action: () => T) => action() } },
    },
  })
  expect(runtime.codec.decode({ $date: 1 })).toEqual({ $date: 1 })
  expect(runtime.codec.encode({ result: true })).toEqual({ result: true })
  expect(runtime.nonreactive(() => 7)).toBe(7)
})

it('refuses missing native codecs and invalid encoded output', () => {
  expect(() => resolveRuntimeCapabilities({})).toThrow('capability')
  const runtime = resolveRuntimeCapabilities({
    EJSON: { fromJSONValue: () => {}, toJSONValue: () => new Map() },
    Tracker: { nonreactive: () => {} },
  })
  expect(() => runtime.codec.encode(null)).toThrow()
})

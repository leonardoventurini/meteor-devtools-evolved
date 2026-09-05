import { validateValue } from '../../Playground/Values'
import type { MethodCodec } from './MethodAdapter'

export const runtimeProperty = (value: unknown, name: string): unknown =>
  value !== null && (typeof value === 'object' || typeof value === 'function')
    ? Reflect.get(value, name)
    : undefined

/**
 * Meteor may expose package exports without global EJSON/Tracker aliases.
 * Retain each native receiver and reject missing capabilities before dispatch.
 */
export const resolveRuntimeCapabilities = (
  scope: unknown,
): {
  codec: MethodCodec
  nonreactive<T>(action: () => T): T
} => {
  const packages = runtimeProperty(scope, 'Package')
  const ejson =
    runtimeProperty(scope, 'EJSON') ??
    runtimeProperty(runtimeProperty(packages, 'ejson'), 'EJSON')
  const tracker =
    runtimeProperty(scope, 'Tracker') ??
    runtimeProperty(runtimeProperty(packages, 'tracker'), 'Tracker')
  const decode = runtimeProperty(ejson, 'fromJSONValue')
  const encode = runtimeProperty(ejson, 'toJSONValue')
  const nonreactive = runtimeProperty(tracker, 'nonreactive')
  if (
    typeof decode !== 'function' ||
    typeof encode !== 'function' ||
    typeof nonreactive !== 'function'
  )
    throw new Error('Native EJSON or Tracker capability unavailable.')
  return {
    codec: {
      decode: value => Reflect.apply(decode, ejson, [value]),
      encode: value => {
        const encoded: unknown = Reflect.apply(encode, ejson, [value])
        validateValue(encoded)
        return encoded
      },
    },
    nonreactive: <T>(action: () => T): T =>
      Reflect.apply(nonreactive, tracker, [action]) as T,
  }
}

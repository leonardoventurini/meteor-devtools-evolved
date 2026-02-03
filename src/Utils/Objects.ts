export const isObject = (value: any) => typeof value === 'object'

export function omit(object, keys) {
  const result = {}
  for (const key of Object.keys(object)) {
    if (!keys.includes(key)) {
      result[key] = object[key]
    }
  }
  return result
}

export function mapValues(object, fn) {
  const result = {}
  for (const key of Object.keys(object)) {
    result[key] = fn(object[key], key)
  }
  return result
}

export function flatten(array) {
  return array.flat()
}

export function compact(array) {
  return array.filter(Boolean)
}

export const isNil = value => value === null || value === undefined

export const isUndefined = value => value === undefined

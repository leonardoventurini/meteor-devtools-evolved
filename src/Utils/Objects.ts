export const isObject = (value: any) => typeof value === 'object'

export function omit(object, keys) {
  return Object.keys(object).reduce((result, key) => {
    if (!keys.includes(key)) {
      result[key] = object[key]
    }

    return result
  }, {})
}

export function mapValues(object, fn) {
  return Object.keys(object).reduce((result, key) => {
    result[key] = fn(object[key])

    return result
  }, {})
}

export function flatten(array) {
  return array.reduce((result, item) => result.concat(item), [])
}

export function compact(array) {
  return array.filter(Boolean)
}

export const isNil = value => value === null || value === undefined

export const isUndefined = value => value === undefined

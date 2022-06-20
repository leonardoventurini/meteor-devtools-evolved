import { isNil, isUndefined } from 'lodash'
import { DEVELOPMENT } from '@/Constants'

export const inDevelopmentOnly = (callback: () => any) => {
 if (DEVELOPMENT) {
  // eslint-disable-next-line no-console
  console.trace('DEVELOPMENT ONLY')
  callback()
 }
}

export const exists = (value: any) => !isNil(value) && !isUndefined(value)

import { DEVELOPMENT } from '@/Constants'
import { isNil } from './Objects'

export const inDevelopmentOnly = (callback: () => any) => {
  if (DEVELOPMENT) {
    console.trace('DEVELOPMENT ONLY')
    callback()
  }
}

export const exists = (value: any) => !isNil(value)

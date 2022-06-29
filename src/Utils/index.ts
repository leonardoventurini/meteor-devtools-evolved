import { isNil, isUndefined } from 'lodash'
import { DEVELOPMENT } from '@/Constants'
import browser from 'webextension-polyfill'

export const inDevelopmentOnly = (callback: () => any) => {
  if (DEVELOPMENT) {
    console.trace('DEVELOPMENT ONLY')
    callback()
  }
}

export const checkFirefoxBrowser = async (): Promise<boolean> => {
  const { name } = (await browser.runtime.getBrowserInfo?.()) || {}
  return name === 'Firefox'
}

export const exists = (value: any) => !isNil(value) && !isUndefined(value)

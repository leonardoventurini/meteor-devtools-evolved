import { DEVELOPMENT } from '@/Constants'
import browser from 'webextension-polyfill'
import { isNil } from './Objects'

export const inDevelopmentOnly = (callback: () => any) => {
  if (DEVELOPMENT) {
    // eslint-disable-next-line no-console
    console.trace('DEVELOPMENT ONLY')
    callback()
  }
}

export const checkFirefoxBrowser = async (): Promise<boolean> => {
  const { name } = (await browser.runtime.getBrowserInfo?.()) || {}
  return name === 'Firefox'
}

export const exists = (value: any) => !isNil(value)

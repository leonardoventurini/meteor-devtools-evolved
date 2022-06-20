import browser from 'webextension-polyfill'

export const openTab = (url: string): void => {
  browser.runtime.sendMessage({
    source: 'meteor-devtools-evolved',
    eventType: 'create-tab',
    data: { url: url },
  })
}

import { browser } from 'wxt/browser'

export const openTab = (url: string): void => {
  browser.runtime
    .sendMessage({
      source: 'meteor-devtools-evolved',
      eventType: 'create-tab',
      data: { url: url },
    })
    .catch(console.error)
}

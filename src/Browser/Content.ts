import browser from 'webextension-polyfill'

const messageHandler = (event: MessageEvent) => {
  // Only accept messages from same frame
  if (event.source !== window) return

  // Only accept messages that we know are ours
  if (event.data.source !== 'meteor-devtools-evolved') return

  browser.runtime.sendMessage(event.data)
}

window.addEventListener('message', messageHandler)

const url = browser.runtime.getURL('/build/inject.js')
const script = document.createElement('script')
script.setAttribute('type', 'text/javascript')
script.setAttribute('src', url)
document.documentElement.prepend(script)

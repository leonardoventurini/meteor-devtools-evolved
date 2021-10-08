const messageHandler = (event: MessageEvent) => {
  // Only accept messages from same frame
  if (event.source !== window) return

  // Only accept messages that we know are ours
  if (event.data.source !== 'meteor-devtools-evolved') return

  chrome.runtime.sendMessage(event.data)
}

window.addEventListener('message', messageHandler)

const url = chrome.extension.getURL('/build/inject.js')
const script = document.createElement('script')
script.setAttribute('type', 'text/javascript')
script.setAttribute('src', url)
document.body.appendChild(script)

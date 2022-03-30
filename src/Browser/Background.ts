import { defer } from 'lodash'

type Connection = Map<number, chrome.runtime.Port>

declare global {
  interface Window {
    connections: Connection
  }
}

const connections: Connection = new Map()

self.connections = connections

const panelListener = () => {
  chrome.runtime.onConnect.addListener(port => {
    console.debug('runtime.onConnect', port)

    port.onMessage.addListener(request => {
      console.debug('port.onMessage', request)

      if (request.name === 'init') {
        connections.set(request.tabId, port)

        port.onDisconnect.addListener(() => {
          connections.delete(request.tabId)
        })
      }
    })
  })
}

const tabRemovalListener = () => {
  chrome.tabs.onRemoved.addListener(tabId => {
    console.debug('tabs.onRemoved', tabId)

    if (connections.has(tabId)) {
      connections.delete(tabId)
    }
  })
}

chrome.action.onClicked.addListener(e => {
  console.debug('action.onClicked', e)

  chrome.tabs
    .create({
      url: 'http://cloud.meteor.com/?utm_source=chrome_extension&utm_medium=extension&utm_campaign=meteor_devtools_evolved',
    })
    .catch(console.error)
})

const handleConsole = ({
  data: { type, message },
}: Message<{ type: ConsoleType; message: string }>) => {
  if (type in console) {
    console[type](message)
  } else {
    console.warn('Wrong console type.')
  }
}

const contentListener = () => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    defer(() => {
      console.debug('runtime.onMessage', request)

      if (request?.eventType === 'console') {
        handleConsole(request)
        return
      }

      const tabId = sender?.tab?.id

      if (tabId && connections.has(tabId)) {
        connections.get(tabId).postMessage(request)
      }
    })

    sendResponse()
  })
}

panelListener()
tabRemovalListener()
contentListener()

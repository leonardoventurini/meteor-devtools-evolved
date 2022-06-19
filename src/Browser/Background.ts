import { defer } from 'lodash'
import browser, { browserAction } from 'webextension-polyfill'

type Connection = Map<number, any>

declare global {
  interface Window {
    connections: Connection
  }
}

const Cache = new Map<number, string[]>()

const connections: Connection = new Map()

self.connections = connections

const panelListener = () => {
  browser.runtime.onConnect.addListener(port => {
    console.debug('runtime.onConnect', port)

    port.onMessage.addListener(request => {
      console.debug('port.onMessage', request)

      if (request.name === 'init') {
        connections.set(request.tabId, port)

        // Pick things from cache and send it to the panel.
        if (Cache.has(request.tabId)) {
          Cache.get(request.tabId).forEach(message => {
            port.postMessage(message)
          })
        }

        port.onDisconnect.addListener(() => {
          connections.delete(request.tabId)
        })
      }
    })
  })
}

const tabRemovalListener = () => {
  browser.tabs.onRemoved.addListener(tabId => {
    console.debug('tabs.onRemoved', tabId)

    if (connections.has(tabId)) {
      connections.delete(tabId)
      Cache.delete(tabId)
    }
  })
}

// For cross-browser support
const action = browser.browserAction || browser.action

action.onClicked.addListener(e => {
  console.debug('action.onClicked', e)

  browser.tabs
    .create({
      url: 'http://cloud.meteor.com/?utm_source=chrome_extension&utm_medium=extension&utm_campaign=meteor_devtools_evolved',
    })
    .catch(console.error)
})

const handleConsole = (
  tabId: number,
  { data: { type, message } }: Message<{ type: ConsoleType; message: string }>,
) => {
  if (type in console) {
    console[type](`[${tabId}]`, message)
  } else {
    console.warn('Wrong console type.')
  }
}

const contentListener = () => {
  // @ts-ignore
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    defer(() => {
      const tabId = sender?.tab?.id

      if (!tabId) return

      // The message event has to from the panel to the content and then through here.
      if (request?.eventType === 'cache:clear') {
        console.debug('clear cache')
        Cache.delete(tabId)
        return
      }

      if (request?.eventType === 'console') {
        handleConsole(tabId, request)
        return
      }

      if (Cache.has(tabId)) {
        const entry = Cache.get(tabId)

        if (entry.length >= 10000) {
          entry.shift()
        }

        entry.push(request)
      } else {
        Cache.set(tabId, [request])
      }

      if (connections.has(tabId)) {
        connections.get(tabId).postMessage(request)
      }
    })

    sendResponse()
  })
}

const tabListener = () => {
  const tabEvent = {
    'create-tab': request =>
      browser.tabs
        .create({
          url: request.data.url,
        })
        .catch(console.error),
  }
  chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.source !== 'meteor-devtools-evolved') return null

    tabEvent[request.eventType]?.(request)
  })
}

panelListener()
tabRemovalListener()
contentListener()
tabListener()

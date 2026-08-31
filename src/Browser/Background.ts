import browser from 'webextension-polyfill'

type Connection = Map<number, browser.Runtime.Port>

interface InitializationRequest {
  name: 'init'
  tabId: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isInitializationRequest = (
  value: unknown,
): value is InitializationRequest =>
  isRecord(value) && value.name === 'init' && typeof value.tabId === 'number'

const isMessage = (value: unknown): value is Message<unknown> =>
  isRecord(value) && typeof value.eventType === 'string' && 'data' in value

const isConsoleMessage = (
  value: unknown,
): value is Message<{ type: ConsoleType; message: string }> =>
  isMessage(value) &&
  value.eventType === 'console' &&
  isRecord(value.data) &&
  typeof value.data.type === 'string' &&
  typeof value.data.message === 'string'

declare global {
  interface Window {
    connections: Connection
  }
}

const Cache = new Map<number, unknown[]>()

const connections: Connection = new Map()

globalThis.connections = connections

const panelListener = () => {
  browser.runtime.onConnect.addListener(port => {
    console.debug('runtime.onConnect', port)

    port.onMessage.addListener(request => {
      console.debug('port.onMessage', request)

      if (isInitializationRequest(request)) {
        connections.set(request.tabId, port)

        // Pick things from cache and send it to the panel.
        if (Cache.has(request.tabId)) {
          for (const message of Cache.get(request.tabId)) {
            port.postMessage(message)
          }
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
      url: 'https://cloud.meteor.com/?utm_source=chrome_extension&utm_medium=extension&utm_campaign=meteor_devtools_evolved',
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
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    setTimeout(() => {
      const tabId = sender?.tab?.id

      if (!tabId) return

      // The message event has to from the panel to the content and then through here.
      if (isMessage(request) && request.eventType === 'cache:clear') {
        console.debug('clear cache')
        Cache.delete(tabId)
        return
      }

      if (isConsoleMessage(request)) {
        handleConsole(tabId, request)
        return
      }

      if (Cache.has(tabId)) {
        const entry = Cache.get(tabId)

        if (entry.length >= 10_000) {
          entry.shift()
        }

        entry.push(request)
      } else {
        Cache.set(tabId, [request])
      }

      if (connections.has(tabId)) {
        connections.get(tabId).postMessage(request)
      }
    }, 0)

    sendResponse(null)
    return true
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
  /**
   * @issue https://stackoverflow.com/a/73836810/10567157
   */
  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      sendResponse({ foo: true })

      if (request.source !== 'meteor-devtools-evolved') return true

      tabEvent[request.eventType]?.(request)

      return true
    },
  )
}

panelListener()
tabRemovalListener()
contentListener()
tabListener()

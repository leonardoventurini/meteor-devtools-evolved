import { browser } from 'wxt/browser'
import { BackgroundMessageCache } from './BackgroundMessageCache'
import { getDDPHistoryPolicy } from './DDPHistoryPolicy'

type Connection = Map<number, ReturnType<typeof browser.runtime.connect>>

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

const cache = new BackgroundMessageCache()

const connections: Connection = new Map()

const panelListener = () => {
  browser.runtime.onConnect.addListener(port => {
    console.debug('runtime.onConnect', port)

    port.onMessage.addListener(async request => {
      console.debug('port.onMessage', request)

      if (isInitializationRequest(request)) {
        const policy = await getDDPHistoryPolicy()

        cache.initializePanel(request.tabId, policy, message =>
          port.postMessage(message),
        )
        connections.set(request.tabId, port)

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

    connections.delete(tabId)
    cache.clear(tabId)
  })
}

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
        cache.clear(tabId)
        return
      }

      if (isConsoleMessage(request)) {
        handleConsole(tabId, request)
        return
      }

      cache.push(tabId, request)

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
  browser.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      sendResponse({ foo: true })

      if (request.source !== 'meteor-devtools-evolved') return true

      tabEvent[request.eventType]?.(request)

      return true
    },
  )
}

export const initializeBackground = () => {
  globalThis.connections = connections

  // WXT normalizes Manifest V2 browser actions and Manifest V3 actions.
  browser.action.onClicked.addListener(tab => {
    console.debug('action.onClicked', tab)

    browser.tabs
      .create({
        url: 'https://cloud.meteor.com/?utm_source=chrome_extension&utm_medium=extension&utm_campaign=meteor_devtools_evolved',
      })
      .catch(console.error)
  })

  panelListener()
  tabRemovalListener()
  contentListener()
  tabListener()
}

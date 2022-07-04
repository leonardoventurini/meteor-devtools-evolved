import { detectType } from '@/Pages/Panel/DDP/FilterConstants'
import prettyBytes from 'pretty-bytes'
import { PanelStore } from '@/Stores/PanelStore'
import { DateTime } from 'luxon'
import { StringUtils } from '@/Utils/StringUtils'
import browser from 'webextension-polyfill'

export const syncSubscriptions = () =>
  Bridge.sendContentMessage({
    eventType: 'sync-subscriptions',
    data: null,
  })

export const syncStats = () =>
  Bridge.sendContentMessage({
    eventType: 'stats',
    data: null,
  })

export const clearCache = () =>
  Bridge.sendContentMessage({
    eventType: 'cache:clear',
    data: null,
  })

export const Bridge = new (class {
  private handlers: Partial<Record<EventType, MessageHandler>> = {}

  register(eventType: EventType, handler: MessageHandler) {
    this.handlers[eventType] = handler
  }

  handle(message: Message<any>) {
    if (message.eventType in this.handlers) {
      const handler = this.handlers[message.eventType]

      if (handler) handler(message)
    }
  }

  sendContentMessage(message: Message<any>) {
    const payload: IMessagePayload<any> = {
      ...message,
      source: 'meteor-devtools-evolved',
    }

    if (browser && browser.devtools) {
      browser.devtools.inspectedWindow.eval(
        `__meteor_devtools_evolved_receiveMessage(${JSON.stringify(payload)})`,
      )
    }
  }

  chrome() {
    const backgroundConnection = browser.runtime.connect({
      name: 'panel',
    })

    backgroundConnection.postMessage({
      name: 'init',
      tabId: browser.devtools.inspectedWindow.tabId,
    })

    backgroundConnection.onMessage.addListener((message: Message<any>) =>
      Bridge.handle(message),
    )
  }

  init() {
    // eslint-disable-next-line no-console
    console.log('Setting up bridge...')

    if (!browser || !browser.devtools) return

    // FIXME : Need to confirm if using `chrome` instead of `browser` breaking any communication
    this.chrome()

    syncStats()
  }
})()

Bridge.register('ddp-event', (message: Message<DDPLog>) => {
  const size = StringUtils.getSize(message.data.content)
  const parsedContent = JSON.parse(message.data.content)
  const filterType = detectType(parsedContent)

  const log = {
    ...message.data,
    parsedContent,
    timestampPretty: message.data.timestamp
      ? DateTime.fromMillis(message.data.timestamp).toFormat('HH:mm:ss.SSS')
      : '',
    timestampLong: message.data.timestamp
      ? DateTime.fromMillis(message.data.timestamp).toLocaleString(
          DateTime.DATETIME_FULL,
        )
      : '',
    size,
    sizePretty: prettyBytes(size),
    filterType,
  }

  if (filterType === 'subscription') {
    syncSubscriptions()
  }

  PanelStore.ddpStore.pushItem(log)
})

Bridge.register(
  'minimongo-get-collections',
  (message: Message<RawCollections>) => {
    PanelStore.minimongoStore.setCollections(message.data)
  },
)

Bridge.register('sync-subscriptions', (message: Message<any>) => {
  PanelStore.syncSubscriptions(JSON.parse(message.data.subscriptions))
})

Bridge.register('stats', (message: Message<any>) => {
  // eslint-disable-next-line no-console
  console.log(message.data)

  PanelStore.setGitCommitHash(message.data.gitCommitHash)
})

Bridge.register('meteor-data-performance', (message: Message<CallData>) => {
  PanelStore.performanceStore.push(message.data)
})

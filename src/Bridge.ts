import { detectType } from '@/Pages/Panel/DDP/FilterConstants'
import prettyBytes from 'pretty-bytes'
import { PanelStore } from '@/Stores/PanelStore'
import { DateTime } from 'luxon'
import { StringUtils } from '@/Utils/StringUtils'
import { browser } from 'wxt/browser'
import { shouldAcceptConnectionPayload } from '@/Injectors/ConnectionScoping'
import { startPlaygroundHandshake } from '@/Playground/PanelHandshake'

export const syncConnections = () =>
  Bridge.sendContentMessage({
    eventType: 'connections:get',
    data: null,
  })

export const syncSubscriptions = (
  connectionId = PanelStore.activeConnectionId,
) =>
  Bridge.sendContentMessage({
    eventType: 'sync-subscriptions',
    data: { connectionId } satisfies ConnectionRequest,
  })

export const syncMinimongo = (connectionId = PanelStore.activeConnectionId) =>
  Bridge.sendContentMessage({
    eventType: 'minimongo-get-collections',
    data: { connectionId } satisfies ConnectionRequest,
  })

export const syncConnectionData = (connectionId: string) => {
  syncSubscriptions(connectionId)
  syncMinimongo(connectionId)
}

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
    console.log('Setting up bridge...')

    if (!browser || !browser.devtools) return

    // FIXME : Need to confirm if using `chrome` instead of `browser` breaking any communication
    this.chrome()

    PanelStore.playgroundStore.connect(command => {
      this.sendContentMessage({
        eventType: 'playground:command',
        data: command,
      })
    })
    const stopHandshake = startPlaygroundHandshake(
      () =>
        this.sendContentMessage({ eventType: 'playground:hello', data: null }),
      () => PanelStore.playgroundStore.sessionReady,
    )
    globalThis.addEventListener(
      'pagehide',
      () => {
        stopHandshake()
        PanelStore.playgroundStore.dispose()
      },
      { once: true },
    )

    syncStats()
    syncConnections()
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

  if (
    filterType === 'subscription' &&
    message.data.connectionId === PanelStore.activeConnectionId
  ) {
    syncSubscriptions(message.data.connectionId)
  }

  PanelStore.ddpStore.pushItem(log)
  PanelStore.playgroundStore.observeLog(log)
})

Bridge.register('playground:event', (message: Message<unknown>) => {
  PanelStore.playgroundStore.handleEvent(message.data)
})

Bridge.register(
  'minimongo-get-collections',
  (message: Message<MinimongoSnapshotPayload>) => {
    if (
      !shouldAcceptConnectionPayload(
        PanelStore.activeConnectionId,
        message.data.connectionId,
      )
    ) {
      return
    }

    PanelStore.minimongoStore.setCollections(
      message.data.collections,
      message.data.metadata,
    )
  },
)

Bridge.register(
  'sync-subscriptions',
  (message: Message<SubscriptionSnapshotPayload>) => {
    if (
      !shouldAcceptConnectionPayload(
        PanelStore.activeConnectionId,
        message.data.connectionId,
      )
    ) {
      return
    }

    PanelStore.syncSubscriptions(JSON.parse(message.data.subscriptions))
  },
)

Bridge.register(
  'connections:get',
  (message: Message<ConnectionListPayload>) => {
    PanelStore.setConnections(message.data.connections)
  },
)

Bridge.register('stats', (message: Message<any>) => {
  console.log(message.data)

  PanelStore.setGitCommitHash(message.data.gitCommitHash)
})

Bridge.register('meteor-data-performance', (message: Message<CallData>) => {
  PanelStore.performanceStore.push(message.data)
})

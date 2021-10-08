import StackTracey from 'stacktracey'
import { DDPInjector } from '@/Injectors/DDPInjector'
import { MinimongoInjector, updateCollections } from '@/Injectors/MinimongoInjector'
import { MeteorAdapter } from '@/Injectors/MeteorAdapter'

const isFrame = location !== parent.location

export const sendMessage = (eventType: EventType, data: object) => {
  window.postMessage(
    {
      eventType,
      data,
      source: 'meteor-devtools-evolved',
    } as Message<object>,
    '*',
  )
}

const warning = (message: string) => {
  sendMessage('console', {
    type: 'info',
    message,
  } as { type: ConsoleType; message: string })
}

warning(
  isFrame
    ? `Initializing from iframe "${location.href}"...`
    : 'Initializing on the main page...',
)

const getStackTrace = (stackTraceLimit: number) => {
  const originalStackTraceLimit = Error.stackTraceLimit

  try {
    Error.stackTraceLimit = stackTraceLimit
    return new StackTracey(new Error())
  } finally {
    Error.stackTraceLimit = originalStackTraceLimit
  }
}

export const sendLogMessage = (message: DDPLog) => {
  const stackTrace = getStackTrace(15).items

  if (stackTrace && stackTrace.length) {
    stackTrace.splice(0, 2)
  }

  sendMessage('ddp-event', {
    ...message,
    trace: stackTrace,
    host: location.host,
  })

  if (message.content !== '{"msg":"ping"}' && message.content !== '{"msg":"pong"}') updateCollections()
}

type MessageHandler = (message: Message<any>) => void
type Registration = {
  eventType: EventType
  handler: MessageHandler
}

interface IRegistry {
  subscriptions: Registration[]

  register(eventType: EventType, handler: MessageHandler): void

  run(message: Message<any>): void
}

export const Registry: IRegistry = {
  subscriptions: [],

  register(eventType: EventType, handler: MessageHandler) {
    this.subscriptions.push({
      eventType,
      handler,
    })
  },

  run(message: IMessagePayload<any>) {
    this.subscriptions.forEach(
      ({ eventType, handler }) =>
        message.source === 'meteor-devtools-evolved' &&
        eventType === message.eventType &&
        handler(message),
    )
  },
}

if (!window.__meteor_devtools_evolved) {
  let attempts = 100

  const interval = window.setInterval(() => {
    --attempts

    if (typeof Meteor === 'object' && !window.__meteor_devtools_evolved) {
      window.__meteor_devtools_evolved = true

      DDPInjector()
      MinimongoInjector()
      MeteorAdapter()

      window.__meteor_devtools_evolved_receiveMessage =
        Registry.run.bind(Registry)

      warning(`Initialized. Attempts: ${100 - attempts}.`)
    }

    if (attempts === 0) {
      clearInterval(interval)

      if (!window.Meteor) {
        warning(
          isFrame
            ? `Unable to find Meteor on iframe "${location.href}"`
            : 'Unable to find Meteor on the main page.',
        )
      }
    }
  }, 10)
}

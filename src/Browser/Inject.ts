import { DDPInjector } from '@/Injectors/DDPInjector'
import {
  MinimongoInjector,
  updateCollections,
} from '@/Injectors/MinimongoInjector'
import { MeteorAdapter } from '@/Injectors/MeteorAdapter'

const PARENTHESIS_REGEX = /(\S*) \(([^)]+)\)/

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

/**
 * @todo Do nothing here, and run any stack trace processing logic inside the extension, so if any errors happen it happens in the sandbox console.
 */
const getStackTrace = (stackTraceLimit: number) => {
  const originalStackTraceLimit = Error.stackTraceLimit

  try {
    Error.stackTraceLimit = stackTraceLimit
    const error = new Error('Stack trace')

    if (!error.stack) return []

    return error?.stack
      ?.split('\n')
      .map(trace => {
        const matches = PARENTHESIS_REGEX.exec(trace)

        if (!matches) return null

        return {
          callee: matches?.[1],
          url: matches?.[2],
        }
      })
      .filter(Boolean)
  } finally {
    Error.stackTraceLimit = originalStackTraceLimit
  }
}

export const sendLogMessage = (message: DDPLog) => {
  const stackTrace = getStackTrace(15)

  if (stackTrace && stackTrace.length > 0) {
    stackTrace.splice(0, 2)
  }

  sendMessage('ddp-event', {
    ...message,
    trace: stackTrace,
    host: location.host,
  })

  if (
    message.content !== '{"msg":"ping"}' &&
    message.content !== '{"msg":"pong"}'
  )
    updateCollections()
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

const subscriptions: Registration[] = []

export const Registry: IRegistry = {
  subscriptions,

  register(eventType: EventType, handler: MessageHandler) {
    subscriptions.push({
      eventType,
      handler,
    })
  },

  run(message: IMessagePayload<any>) {
    for (const { eventType, handler } of subscriptions) {
      if (
        message.source === 'meteor-devtools-evolved' &&
        eventType === message.eventType
      ) {
        handler(message)
      }
    }
  },
}

export function injectAll() {
  const isFrame = (() => {
    try {
      return globalThis.self !== window.top
    } catch {
      return true
    }
  })()

  if (!globalThis.__meteor_devtools_evolved) {
    if (isFrame) return false

    warning(
      isFrame
        ? `Initializing from iframe "${location.href}"...`
        : 'Initializing on the main page...',
    )

    let attempts = 100
    let interval = null

    function inject() {
      --attempts

      if (typeof Meteor === 'object' && !globalThis.__meteor_devtools_evolved) {
        globalThis.__meteor_devtools_evolved = true

        DDPInjector()
        MinimongoInjector()
        MeteorAdapter()

        globalThis.__meteor_devtools_evolved_receiveMessage =
          Registry.run.bind(Registry)

        warning(`Initialized. Attempts: ${100 - attempts}.`)
      }

      if (attempts === 0) {
        clearInterval(interval)

        if (!globalThis.Meteor) {
          warning(
            isFrame
              ? `Unable to find Meteor on iframe "${location.href}"`
              : 'Unable to find Meteor on the main page.',
          )
        }
      }
    }

    inject()

    interval = globalThis.setInterval(inject, 10)
  }
}

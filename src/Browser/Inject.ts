import { DDPInjector } from '@/Injectors/DDPInjector'
import { MinimongoInjector } from '@/Injectors/MinimongoInjector'
import { MeteorAdapter } from '@/Injectors/MeteorAdapter'
import { parseStackTrace } from '@/Utils/StackTrace'
import { initializeMeteorConnections } from '@/Injectors/MeteorConnections'

const STACK_TRACE_LIMIT = 50
const HEARTBEAT_MESSAGES = new Set(['{"msg":"ping"}', '{"msg":"pong"}'])
const METEOR_DISCOVERY_INTERVAL_MS = 10
const METEOR_DISCOVERY_TIMEOUT_MS = 10_000
const METEOR_DISCOVERY_ATTEMPTS =
  METEOR_DISCOVERY_TIMEOUT_MS / METEOR_DISCOVERY_INTERVAL_MS

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

const getStackTrace = (stackTraceLimit: number) => {
  const originalStackTraceLimit = Error.stackTraceLimit

  try {
    Error.stackTraceLimit = stackTraceLimit
    const error = new Error('Stack trace')

    if (!error.stack) return []

    return parseStackTrace(error.stack)
  } finally {
    Error.stackTraceLimit = originalStackTraceLimit
  }
}

export const sendLogMessage = (message: DDPLog) => {
  const trace = shouldCaptureDDPStack(message)
    ? getStackTrace(STACK_TRACE_LIMIT)
    : undefined

  sendMessage('ddp-event', {
    ...message,
    ...(trace ? { trace } : {}),
    host: location.host,
  })
}

export const shouldCaptureDDPStack = (message: DDPLog): boolean =>
  message.isOutbound === true && !HEARTBEAT_MESSAGES.has(message.content)

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

    let attempts = METEOR_DISCOVERY_ATTEMPTS
    let interval: ReturnType<typeof setInterval> | undefined

    function inject() {
      --attempts

      if (typeof Meteor === 'object' && !globalThis.__meteor_devtools_evolved) {
        globalThis.__meteor_devtools_evolved = true

        initializeMeteorConnections(Meteor.connection, DDP, Mongo)
        DDPInjector()
        MinimongoInjector()
        MeteorAdapter()

        globalThis.__meteor_devtools_evolved_receiveMessage =
          Registry.run.bind(Registry)

        if (interval) clearInterval(interval)

        warning(
          `Initialized. Attempts: ${METEOR_DISCOVERY_ATTEMPTS - attempts}.`,
        )
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

    if (!globalThis.__meteor_devtools_evolved) {
      interval = globalThis.setInterval(inject, METEOR_DISCOVERY_INTERVAL_MS)
    }
  }
}

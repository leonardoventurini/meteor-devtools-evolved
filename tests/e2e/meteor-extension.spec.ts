import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const EXTENSION_MESSAGE_SOURCE = 'meteor-devtools-evolved'
const CAPTURED_MESSAGES_KEY = '__meteorDevtoolsE2EMessages'
const DEFAULT_CONNECTION_ID = 'default'
const ADDITIONAL_CONNECTION_ID = 'connection-1'
const LOCAL_COLLECTION_NAMES = ['Local collection 1', 'Local collection 2']

interface ExtensionMessage<TData = unknown> {
  source: string
  eventType: string
  data: TData
}

interface DDPEventData {
  connectionId: string
  content: string
  isOutbound: boolean
}

interface ConnectionListData {
  connections: Array<{ displayName: string; id: string }>
}

interface MinimongoSnapshotData {
  connectionId: string
  collections: Record<string, Array<Record<string, unknown>>>
  metadata: Record<string, { actualName: string | null }>
}

interface SubscriptionSnapshotData {
  connectionId: string
  subscriptions: string
}

interface BrowserIntegrationScope {
  Meteor: {
    callAsync<T>(methodName: string, ...parameters: unknown[]): Promise<T>
  }
  __meteor_devtools_evolved: boolean
  __meteor_devtools_evolved_receiveMessage(message: ExtensionMessage): void
  __meteorDevtoolsE2EMessages: ExtensionMessage[]
}

const installMessageCapture = async (page: Page): Promise<void> => {
  await page.addInitScript(
    ({ captureKey, messageSource }) => {
      const scope = globalThis as unknown as Record<string, unknown>
      scope[captureKey] = []

      globalThis.addEventListener('message', event => {
        if (
          event.source !== globalThis.window ||
          typeof event.data !== 'object' ||
          event.data === null ||
          event.data.source !== messageSource
        ) {
          return
        }

        ;(scope[captureKey] as unknown[]).push(event.data)
      })
    },
    {
      captureKey: CAPTURED_MESSAGES_KEY,
      messageSource: EXTENSION_MESSAGE_SOURCE,
    },
  )
}

const getCapturedMessages = (page: Page): Promise<ExtensionMessage[]> =>
  page.evaluate(
    () =>
      (globalThis as unknown as BrowserIntegrationScope)
        .__meteorDevtoolsE2EMessages,
  )

const clearCapturedMessages = (page: Page): Promise<void> =>
  page.evaluate(() => {
    ;(
      globalThis as unknown as BrowserIntegrationScope
    ).__meteorDevtoolsE2EMessages = []
  })

const sendProductionRequest = (
  page: Page,
  eventType: string,
  data: unknown,
): Promise<void> =>
  page.evaluate(
    ({ requestData, requestEventType, source }) => {
      ;(
        globalThis as unknown as BrowserIntegrationScope
      ).__meteor_devtools_evolved_receiveMessage({
        source,
        eventType: requestEventType,
        data: requestData,
      })
    },
    {
      requestData: data,
      requestEventType: eventType,
      source: EXTENSION_MESSAGE_SOURCE,
    },
  )

const waitForEvent = async <TData>(
  page: Page,
  eventType: string,
): Promise<ExtensionMessage<TData>> => {
  await page.waitForFunction(
    ({ captureKey, expectedEventType }) => {
      const messages = (globalThis as unknown as Record<string, unknown>)[
        captureKey
      ] as ExtensionMessage[]
      return messages.some(message => message.eventType === expectedEventType)
    },
    { captureKey: CAPTURED_MESSAGES_KEY, expectedEventType: eventType },
  )

  const capturedMessages = await getCapturedMessages(page)
  const message = capturedMessages.find(
    candidate => candidate.eventType === eventType,
  )

  if (!message) {
    throw new Error(`Extension event ${eventType} disappeared after capture.`)
  }

  return message as ExtensionMessage<TData>
}

test.beforeEach(async ({ page }) => {
  await installMessageCapture(page)
  await page.goto('/')
  await expect(page.getByText('Learn Meteor!')).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (globalThis as unknown as BrowserIntegrationScope)
            .__meteor_devtools_evolved,
      ),
    )
    .toBe(true)
})

test('captures real Meteor 3 runtime data through the packaged extension', async ({
  extensionId,
  extensionWorker,
  page,
}) => {
  expect(new URL(extensionWorker.url()).hostname).toBe(extensionId)
  await expect(
    page.locator(`script[src="chrome-extension://${extensionId}/inject.js"]`),
  ).toHaveCount(1)

  await clearCapturedMessages(page)
  const aboutResult = await page.evaluate(() =>
    (globalThis as unknown as BrowserIntegrationScope).Meteor.callAsync<string>(
      'about',
    ),
  )
  expect(aboutResult).toContain('This is a Meteor application')

  await expect
    .poll(async () => {
      const capturedMessages = await getCapturedMessages(page)
      const events = capturedMessages
        .filter(
          (message): message is ExtensionMessage<DDPEventData> =>
            message.eventType === 'ddp-event',
        )
        .map(
          message =>
            JSON.parse(message.data.content) as Record<string, unknown>,
        )
      const method = events.find(
        message => message.msg === 'method' && message.method === 'about',
      )

      return Boolean(
        method &&
        events.some(
          message => message.msg === 'result' && message.id === method.id,
        ),
      )
    })
    .toBe(true)

  await clearCapturedMessages(page)
  await sendProductionRequest(page, 'connections:get', null)
  const connectionMessage = await waitForEvent<ConnectionListData>(
    page,
    'connections:get',
  )
  expect(connectionMessage.data.connections).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: DEFAULT_CONNECTION_ID }),
      expect.objectContaining({ id: ADDITIONAL_CONNECTION_ID }),
    ]),
  )

  await clearCapturedMessages(page)
  await sendProductionRequest(page, 'minimongo-get-collections', {
    connectionId: DEFAULT_CONNECTION_ID,
  })
  const minimongoMessage = await waitForEvent<MinimongoSnapshotData>(
    page,
    'minimongo-get-collections',
  )
  expect(minimongoMessage.data.connectionId).toBe(DEFAULT_CONNECTION_ID)
  expect(Object.keys(minimongoMessage.data.collections)).toEqual(
    expect.arrayContaining(['links', ...LOCAL_COLLECTION_NAMES]),
  )
  const links = minimongoMessage.data.collections.links
  if (!links) throw new Error('The links collection was not captured.')

  expect(links.length).toBeGreaterThan(0)
  expect(
    minimongoMessage.data.collections['Local collection 1'],
  ).toContainEqual(
    expect.objectContaining({ _id: 'local-one', fixture: 'Meteor 3.5.1' }),
  )
  expect(
    minimongoMessage.data.collections['Local collection 2'],
  ).toContainEqual(
    expect.objectContaining({ _id: 'local-two', fixture: 'Meteor 3.5.1' }),
  )
  expect(minimongoMessage.data.metadata['Local collection 1']).toEqual({
    actualName: null,
  })

  await clearCapturedMessages(page)
  await sendProductionRequest(page, 'sync-subscriptions', {
    connectionId: DEFAULT_CONNECTION_ID,
  })
  const subscriptionMessage = await waitForEvent<SubscriptionSnapshotData>(
    page,
    'sync-subscriptions',
  )
  expect(subscriptionMessage.data.connectionId).toBe(DEFAULT_CONNECTION_ID)
  expect(subscriptionMessage.data.subscriptions).toContain('links')
})

test('renders the packaged DevTools panel navigation', async ({
  extensionId,
  page,
}) => {
  await page.goto(`chrome-extension://${extensionId}/devtools-panel.html`)

  for (const tabName of [
    'DDP',
    'Bookmarks',
    'Minimongo',
    'Subscriptions',
    'Performance',
  ]) {
    await expect(page.getByRole('button', { name: tabName })).toBeVisible()
  }

  await expect(page.getByRole('button', { name: 'Help' })).toBeVisible()
  await expect(
    page.getByRole('combobox', { name: 'Meteor DDP connection' }),
  ).toBeVisible()
})

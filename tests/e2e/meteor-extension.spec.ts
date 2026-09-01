import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { resolveMeteorFixture } from './MeteorFixtures'

const EXTENSION_MESSAGE_SOURCE = 'meteor-devtools-evolved'
const CAPTURED_MESSAGES_KEY = '__meteorDevtoolsE2EMessages'
const DEFAULT_CONNECTION_ID = 'default'
const ADDITIONAL_CONNECTION_ID = 'connection-1'
const LOCAL_COLLECTION_NAMES = ['Local collection 1', 'Local collection 2']
const meteorFixture = resolveMeteorFixture()

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
    call(methodName: string, ...parameters: unknown[]): void
    release: string
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

const pollProductionEvent = async <TData>(
  page: Page,
  eventType: string,
  requestData: unknown,
  predicate: (data: TData) => boolean,
): Promise<TData> => {
  let matchedData: TData | undefined

  await expect
    .poll(async () => {
      await clearCapturedMessages(page)
      await sendProductionRequest(page, eventType, requestData)
      const message = await waitForEvent<TData>(page, eventType)

      if (predicate(message.data)) matchedData = message.data
      return Boolean(matchedData)
    })
    .toBe(true)

  if (!matchedData) {
    throw new Error(`Extension event ${eventType} never matched its predicate.`)
  }

  return matchedData
}

test.beforeEach(async ({ page }) => {
  await installMessageCapture(page)
  await page.goto('/')
  await expect(page.getByText(meteorFixture.readinessText)).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (globalThis as unknown as BrowserIntegrationScope)
            .__meteor_devtools_evolved,
      ),
    )
    .toBe(true)
  await expect
    .poll(() =>
      page.evaluate(
        () => (globalThis as unknown as BrowserIntegrationScope).Meteor.release,
      ),
    )
    .toBe(meteorFixture.release)
})

test('captures real Meteor runtime data through the packaged extension', async ({
  extensionId,
  extensionWorker,
  page,
}) => {
  expect(new URL(extensionWorker.url()).hostname).toBe(extensionId)
  await expect(
    page.locator(`script[src="chrome-extension://${extensionId}/inject.js"]`),
  ).toHaveCount(1)

  await clearCapturedMessages(page)
  const methodResult = await page.evaluate(
    ({ methodName, methodParameters }) =>
      new Promise<unknown>((resolve, reject) => {
        const scope = globalThis as unknown as BrowserIntegrationScope
        scope.Meteor.call(
          methodName,
          ...methodParameters,
          (error: unknown, result: unknown) => {
            if (error) {
              reject(new Error(String(error)))
              return
            }

            resolve(result)
          },
        )
      }),
    {
      methodName: meteorFixture.method.name,
      methodParameters: meteorFixture.method.parameters,
    },
  )
  if (meteorFixture.method.resultComparison === 'equals') {
    expect(methodResult).toBe(meteorFixture.method.expectedResult)
  } else {
    expect(methodResult).toContain(meteorFixture.method.expectedResult)
  }

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
        message =>
          message.msg === 'method' &&
          message.method === meteorFixture.method.name,
      )

      return Boolean(
        method &&
        events.some(
          message => message.msg === 'result' && message.id === method.id,
        ),
      )
    })
    .toBe(true)

  const connectionData = await pollProductionEvent<ConnectionListData>(
    page,
    'connections:get',
    null,
    data =>
      [DEFAULT_CONNECTION_ID, ADDITIONAL_CONNECTION_ID].every(connectionId =>
        data.connections.some(connection => connection.id === connectionId),
      ),
  )
  expect(connectionData.connections).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: DEFAULT_CONNECTION_ID }),
      expect.objectContaining({ id: ADDITIONAL_CONNECTION_ID }),
    ]),
  )

  const minimongoData = await pollProductionEvent<MinimongoSnapshotData>(
    page,
    'minimongo-get-collections',
    { connectionId: DEFAULT_CONNECTION_ID },
    data =>
      Boolean(data.collections[meteorFixture.namedCollection]?.length) &&
      LOCAL_COLLECTION_NAMES.every(collectionName =>
        data.collections[collectionName]?.some(document =>
          ['local-one', 'local-two'].includes(String(document._id)),
        ),
      ),
  )
  expect(minimongoData.connectionId).toBe(DEFAULT_CONNECTION_ID)
  expect(Object.keys(minimongoData.collections)).toEqual(
    expect.arrayContaining([
      meteorFixture.namedCollection,
      ...LOCAL_COLLECTION_NAMES,
    ]),
  )
  const namedDocuments =
    minimongoData.collections[meteorFixture.namedCollection]
  if (!namedDocuments) {
    throw new Error(
      `The ${meteorFixture.namedCollection} collection was not captured.`,
    )
  }

  expect(namedDocuments.length).toBeGreaterThan(0)
  expect(minimongoData.collections['Local collection 1']).toContainEqual(
    expect.objectContaining({
      _id: 'local-one',
      fixture: meteorFixture.localFixtureLabel,
    }),
  )
  expect(minimongoData.collections['Local collection 2']).toContainEqual(
    expect.objectContaining({
      _id: 'local-two',
      fixture: meteorFixture.localFixtureLabel,
    }),
  )
  expect(minimongoData.metadata['Local collection 1']).toEqual({
    actualName: null,
  })

  const subscriptionData = await pollProductionEvent<SubscriptionSnapshotData>(
    page,
    'sync-subscriptions',
    { connectionId: DEFAULT_CONNECTION_ID },
    data =>
      meteorFixture.requiredSubscriptions.every(subscriptionName =>
        data.subscriptions.includes(subscriptionName),
      ),
  )
  expect(subscriptionData.connectionId).toBe(DEFAULT_CONNECTION_ID)
  for (const subscriptionName of meteorFixture.requiredSubscriptions) {
    expect(subscriptionData.subscriptions).toContain(subscriptionName)
  }
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

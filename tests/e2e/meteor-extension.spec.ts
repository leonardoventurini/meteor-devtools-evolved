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

interface PerformanceEventData {
  collectionName: string
  key: string
  timing: 'async' | 'sync'
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
  __meteorDevtoolsFixture: MeteorValidationFixture
}

interface FixtureStatus {
  baseline: { events: number; projects: number; tasks: number }
  ready: boolean
  secondary: { count: number; ready: boolean }
}

interface MeteorValidationFixture {
  contractVersion: number
  metadata: {
    collections: readonly string[]
    counts: Record<string, number>
    methods: readonly string[]
    publications: readonly string[]
  }
  burst(count?: number): Promise<unknown>
  complexValues(): Promise<unknown>
  delayedSuccess(delayMs?: number): Promise<unknown>
  getStatus(): FixtureStatus
  localPerformance(): Promise<unknown>
  methodFailure(): Promise<unknown>
  mutationLifecycle(): Promise<unknown>
  publicationLifecycle(): Promise<unknown>
  reset(): Promise<unknown>
  structuredEcho(payload?: unknown): Promise<unknown>
  waitUntilReady(): Promise<FixtureStatus>
}

type FixtureScenario = Exclude<
  keyof MeteorValidationFixture,
  'contractVersion' | 'getStatus' | 'metadata' | 'waitUntilReady'
>

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

const invokeFixtureScenario = (
  page: Page,
  scenario: FixtureScenario,
  argument?: unknown,
): Promise<unknown> =>
  page.evaluate(
    async ({ scenarioName, scenarioArgument }) => {
      const fixture = (globalThis as unknown as BrowserIntegrationScope)
        .__meteorDevtoolsFixture
      const run = fixture[scenarioName] as (
        argument?: unknown,
      ) => Promise<unknown>

      return run(scenarioArgument)
    },
    { scenarioArgument: argument, scenarioName: scenario },
  )

const getCapturedDDPMessages = async (
  page: Page,
  connectionId = DEFAULT_CONNECTION_ID,
): Promise<Array<Record<string, unknown>>> => {
  const capturedMessages = await getCapturedMessages(page)

  return capturedMessages
    .filter(
      (message): message is ExtensionMessage<DDPEventData> =>
        message.eventType === 'ddp-event' &&
        (message.data as DDPEventData).connectionId === connectionId,
    )
    .map(message => JSON.parse(message.data.content) as Record<string, unknown>)
}

const waitForCorrelatedMethod = async (
  page: Page,
  methodName: string,
  expectError = false,
): Promise<void> => {
  await expect
    .poll(async () => {
      const events = await getCapturedDDPMessages(page)
      const method = events.find(
        event => event.msg === 'method' && event.method === methodName,
      )
      if (typeof method?.id !== 'string') return false

      const result = events.find(
        event => event.msg === 'result' && event.id === method.id,
      )
      const updated = events.some(
        event =>
          event.msg === 'updated' &&
          Array.isArray(event.methods) &&
          event.methods.includes(method.id),
      )

      return Boolean(result && updated && Boolean(result.error) === expectError)
    })
    .toBe(true)
}

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
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const fixture = (globalThis as unknown as BrowserIntegrationScope)
          .__meteorDevtoolsFixture
        if (!fixture) return false

        const status = await fixture.waitUntilReady()
        return status.ready && status.secondary.ready
      }),
    )
    .toBe(true)
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
    data => Boolean(data.collections[meteorFixture.namedCollection]?.length),
  )
  expect(minimongoData.connectionId).toBe(DEFAULT_CONNECTION_ID)
  expect(Object.keys(minimongoData.collections)).toEqual(
    expect.arrayContaining([meteorFixture.namedCollection]),
  )
  const namedDocuments =
    minimongoData.collections[meteorFixture.namedCollection]
  if (!namedDocuments) {
    throw new Error(
      `The ${meteorFixture.namedCollection} collection was not captured.`,
    )
  }

  expect(namedDocuments.length).toBeGreaterThan(0)

  const localCollectionData = await pollProductionEvent<MinimongoSnapshotData>(
    page,
    'minimongo-get-collections',
    { connectionId: DEFAULT_CONNECTION_ID },
    data =>
      LOCAL_COLLECTION_NAMES.every(collectionName =>
        data.collections[collectionName]?.some(document =>
          ['local-one', 'local-two'].includes(String(document._id)),
        ),
      ),
  )
  expect(Object.keys(localCollectionData.collections)).toEqual(
    expect.arrayContaining(LOCAL_COLLECTION_NAMES),
  )
  expect(localCollectionData.collections['Local collection 1']).toContainEqual(
    expect.objectContaining({
      _id: 'local-one',
      fixture: meteorFixture.localFixtureLabel,
    }),
  )
  expect(localCollectionData.collections['Local collection 2']).toContainEqual(
    expect.objectContaining({
      _id: 'local-two',
      fixture: meteorFixture.localFixtureLabel,
    }),
  )
  expect(localCollectionData.metadata['Local collection 1']).toEqual({
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

test('exposes the shared rich fixture contract and isolated snapshots', async ({
  page,
}) => {
  const contract = await page.evaluate(() => {
    const fixture = (globalThis as unknown as BrowserIntegrationScope)
      .__meteorDevtoolsFixture
    return {
      contractVersion: fixture.contractVersion,
      metadata: fixture.metadata,
      status: fixture.getStatus(),
    }
  })

  expect(contract.contractVersion).toBe(meteorFixture.contractVersion)
  expect(contract.metadata.counts).toEqual(meteorFixture.collectionCounts)
  expect(contract.metadata.publications).toEqual(meteorFixture.publications)
  expect(contract.metadata.methods).toEqual(meteorFixture.methods)
  expect(contract.status.baseline).toEqual({
    events: 510,
    projects: 20,
    tasks: 220,
  })
  expect(contract.status.secondary).toEqual({ count: 12, ready: true })

  const primary = await pollProductionEvent<MinimongoSnapshotData>(
    page,
    'minimongo-get-collections',
    { connectionId: DEFAULT_CONNECTION_ID },
    data =>
      data.collections.fixtureProjects?.length === 20 &&
      data.collections.fixtureTasks?.length === 220 &&
      data.collections.fixtureEvents?.length === 510,
  )
  expect(primary.collections.fixtureRemote ?? []).toHaveLength(0)

  const primaryDocuments = [
    ...(primary.collections.fixtureProjects ?? []),
    ...(primary.collections.fixtureTasks ?? []),
    ...(primary.collections.fixtureEvents ?? []),
  ]
  const serializedDocuments = JSON.stringify(primaryDocuments)
  expect(primaryDocuments).toHaveLength(750)
  expect(serializedDocuments).toMatch(/[\u0080-\uFFFF]/)
  expect(serializedDocuments).toContain('null')
  expect(serializedDocuments).toContain(String.raw`\n`)
  expect(serializedDocuments).toMatch(/20\d{2}-\d{2}-\d{2}T/)
  expect(
    primaryDocuments.some(document =>
      Object.values(document).some(
        value => typeof value === 'string' && value.length >= 256,
      ),
    ),
  ).toBe(true)
  expect(
    primaryDocuments.some(document =>
      Object.values(document).some(value => Array.isArray(value)),
    ),
  ).toBe(true)
  expect(
    primaryDocuments.some(document =>
      Object.values(document).some(
        value =>
          typeof value === 'object' && value !== null && !Array.isArray(value),
      ),
    ),
  ).toBe(true)

  const secondary = await pollProductionEvent<MinimongoSnapshotData>(
    page,
    'minimongo-get-collections',
    { connectionId: ADDITIONAL_CONNECTION_ID },
    data => data.collections.fixtureRemote?.length === 12,
  )
  expect(secondary.collections.fixtureRemote).toHaveLength(12)
  expect(secondary.collections.fixtureProjects ?? []).toHaveLength(0)
  expect(secondary.collections.fixtureTasks ?? []).toHaveLength(0)
  expect(secondary.collections.fixtureEvents ?? []).toHaveLength(0)

  const secondarySubscriptions =
    await pollProductionEvent<SubscriptionSnapshotData>(
      page,
      'sync-subscriptions',
      { connectionId: ADDITIONAL_CONNECTION_ID },
      data => data.subscriptions.includes('fixture.remote'),
    )
  expect(secondarySubscriptions.subscriptions).not.toContain('fixture.projects')
  expect(secondarySubscriptions.subscriptions).not.toContain(
    'fixture.dashboard',
  )
})

test('captures correlated method success, delay, failure, and mutation traffic', async ({
  page,
}) => {
  await clearCapturedMessages(page)
  const echoPayload = {
    nested: { enabled: true, score: -1 },
    tags: ['alpha', 'meteor'],
    text: 'Olá, Meteor 🚀',
  }
  const echoResult = (await invokeFixtureScenario(
    page,
    'structuredEcho',
    echoPayload,
  )) as Record<string, unknown>
  expect((echoResult.payload as Record<string, unknown>) ?? echoResult).toEqual(
    expect.objectContaining(echoPayload),
  )
  await waitForCorrelatedMethod(page, 'fixture.echo')

  await clearCapturedMessages(page)
  await invokeFixtureScenario(page, 'complexValues')
  await waitForCorrelatedMethod(page, 'fixture.values')

  await clearCapturedMessages(page)
  const startedAt = Date.now()
  await invokeFixtureScenario(page, 'delayedSuccess', 100)
  expect(Date.now() - startedAt).toBeGreaterThanOrEqual(75)
  await waitForCorrelatedMethod(page, 'fixture.delayed')

  await clearCapturedMessages(page)
  await invokeFixtureScenario(page, 'methodFailure')
  await waitForCorrelatedMethod(page, 'fixture.fail', true)

  await clearCapturedMessages(page)
  await invokeFixtureScenario(page, 'mutationLifecycle')
  for (const methodName of [
    'fixture.mutation.insert',
    'fixture.mutation.update',
    'fixture.mutation.remove',
  ]) {
    await waitForCorrelatedMethod(page, methodName)
  }
  await expect
    .poll(async () => {
      const events = await getCapturedDDPMessages(page)
      const mutationEvents = events.filter(event =>
        ['added', 'changed', 'removed'].includes(String(event.msg)),
      )
      return new Set(mutationEvents.map(event => event.msg))
    })
    .toEqual(new Set(['added', 'changed', 'removed']))

  await invokeFixtureScenario(page, 'reset')
})

test('captures correlated publication lifecycles, bounded bursts, and performance', async ({
  page,
}) => {
  await clearCapturedMessages(page)
  await invokeFixtureScenario(page, 'publicationLifecycle')
  await expect
    .poll(async () => {
      const events = await getCapturedDDPMessages(page)
      const subscriptions = events.filter(event => event.msg === 'sub')
      const byName = (name: string) =>
        subscriptions.find(event => event.name === name)
      const hasReady = (subscription: Record<string, unknown> | undefined) =>
        typeof subscription?.id === 'string' &&
        events.some(
          event =>
            event.msg === 'ready' &&
            Array.isArray(event.subs) &&
            event.subs.includes(subscription.id),
        )
      const hasUnsub = (subscription: Record<string, unknown> | undefined) =>
        typeof subscription?.id === 'string' &&
        events.some(
          event => event.msg === 'unsub' && event.id === subscription.id,
        )
      const rejected = byName('fixture.rejected')

      return (
        hasReady(byName('fixture.empty')) &&
        hasReady(byName('fixture.delayed')) &&
        hasReady(byName('fixture.tasks.overlap')) &&
        hasUnsub(byName('fixture.delayed')) &&
        typeof rejected?.id === 'string' &&
        events.some(
          event =>
            event.msg === 'nosub' &&
            event.id === rejected.id &&
            Boolean(event.error),
        )
      )
    })
    .toBe(true)

  await clearCapturedMessages(page)
  await invokeFixtureScenario(page, 'burst', 5)
  await expect
    .poll(async () => {
      const events = await getCapturedDDPMessages(page)
      return events.filter(
        event => event.msg === 'method' && event.method === 'fixture.burst',
      ).length
    })
    .toBe(5)

  await clearCapturedMessages(page)
  await invokeFixtureScenario(page, 'localPerformance')
  await expect
    .poll(async () => {
      const messages = await getCapturedMessages(page)
      return messages
        .filter(
          (message): message is ExtensionMessage<PerformanceEventData> =>
            message.eventType === 'meteor-data-performance',
        )
        .map(message => message.data)
    })
    .toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          timing: meteorFixture.id === 'devapp-3.5' ? 'async' : 'sync',
        }),
      ]),
    )
})

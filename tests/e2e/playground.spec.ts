import { readFile } from 'node:fs/promises'
import type { Page, Worker } from '@playwright/test'
import { expect, test, launchExtensionContext } from './fixtures'
import { resolveMeteorFixture } from './MeteorFixtures'
import type { RunnerEvent, RunRecord } from '../../src/Playground/RunRecord'
import type { SavedCase, SavedSnapshot } from '../../src/Playground/Records'

const fixture = resolveMeteorFixture()
const DATABASE = 'MeteorToolsPlaygroundDatabase'
interface InspectedRuntime {
  __meteor_devtools_evolved: boolean
  __playgroundCaptured: Array<{ eventType: string; data: RunnerEvent }>
  __meteorDevtoolsFixture: { waitUntilReady(): Promise<unknown> }
  __meteorDevtoolsPlaygroundFixture: { login(label: string): Promise<string> }
  Meteor: {
    connection: {
      _subscriptions: Record<string, { name: string }>
      apply(
        name: string,
        args: unknown[],
        options: { noRetry: true },
        callback: (error: unknown, result?: unknown) => void,
      ): unknown
      subscribe(
        name: string,
        ...args: unknown[]
      ): { subscriptionId: string; stop(): void }
    }
  }
  Accounts: { _storedLoginToken(): string | null }
}
interface ExtensionScope {
  chrome: {
    tabs: {
      query(query: {
        active: boolean
        currentWindow: boolean
      }): Promise<Array<{ id?: number }>>
    }
  }
}
const records = (page: Page): Promise<RunRecord[]> =>
  page.evaluate(() =>
    (globalThis as unknown as InspectedRuntime).__playgroundCaptured.flatMap(
      message =>
        message.eventType === 'playground:event' && message.data.kind === 'run'
          ? [message.data.record]
          : [],
    ),
  )
const latest = (page: Page): Promise<RunRecord | undefined> =>
  records(page).then(items => items.at(-1))
const settled = async (page: Page, previousId?: string): Promise<RunRecord> => {
  await expect
    .poll(async () => {
      const run = await latest(page)
      return Boolean(run?.finished && run.request.requestId !== previousId)
    })
    .toBe(true)
  const run = await latest(page)
  if (!run) throw new Error('Expected completed playground run.')
  return run
}

/**
 * Opens the actual packaged panel and supplies only Chrome's inspectedWindow
 * host API. Commands evaluate in the real inspected tab; background ports,
 * content injection, runner and storage are the packaged production code.
 */
const openPanel = async (
  inspected: Page,
  worker: Worker,
  extensionId: string,
): Promise<Page> => {
  await inspected.addInitScript(() => {
    const scope = globalThis as unknown as InspectedRuntime
    scope.__playgroundCaptured = []
    globalThis.addEventListener('message', event => {
      if (
        event.source === globalThis.window &&
        event.data?.source === 'meteor-devtools-evolved'
      )
        scope.__playgroundCaptured.push(event.data)
    })
  })
  await inspected.goto(fixture.url)
  await expect(inspected.getByText(fixture.readinessText)).toBeVisible()
  await inspected.evaluate(() =>
    (
      globalThis as unknown as InspectedRuntime
    ).__meteorDevtoolsFixture.waitUntilReady(),
  )
  await expect
    .poll(() =>
      inspected.evaluate(
        () =>
          (globalThis as unknown as InspectedRuntime).__meteor_devtools_evolved,
      ),
    )
    .toBe(true)
  await inspected.bringToFront()
  const tabId = await worker.evaluate(async () => {
    const tabs = await (
      globalThis as unknown as ExtensionScope
    ).chrome.tabs.query({ active: true, currentWindow: true })
    return tabs[0]?.id
  })
  if (tabId === undefined)
    throw new Error('Inspected browser tab ID unavailable.')
  const panel = await inspected.context().newPage()
  await panel.exposeFunction('__playgroundEvaluate', (source: string) =>
    inspected.evaluate(source),
  )
  await panel.addInitScript(id => {
    const scope = globalThis as unknown as {
      chrome: Record<string, unknown>
      __playgroundEvaluate(source: string): Promise<unknown>
    }
    scope.chrome.devtools = {
      inspectedWindow: {
        tabId: id,
        eval(
          source: string,
          callback?: (value: unknown, exception?: unknown) => void,
        ) {
          void scope
            .__playgroundEvaluate(source)
            .then(value => callback?.(value))
            .catch(() => callback?.(undefined, { isException: true }))
        },
      },
    }
  }, tabId)
  await panel.goto(`chrome-extension://${extensionId}/devtools-panel.html`)
  await panel.getByRole('button', { name: 'Playground', exact: true }).click()
  await expect(
    panel
      .getByRole('status')
      .filter({ hasText: 'Inspected page session ready' }),
  )
    .toBeVisible()
    .catch(async error => {
      const events = await inspected.evaluate(() =>
        (globalThis as unknown as InspectedRuntime).__playgroundCaptured
          .filter(message => message.eventType === 'playground:event')
          .map(message => message.data),
      )
      throw new Error(
        `${error instanceof Error ? error.message : 'Panel handshake failed'}; Playground handshake events: ${JSON.stringify(events)}`,
      )
    })
  await panel
    .getByRole('combobox', { name: 'Target connection', exact: true })
    .selectOption('default')
  await panel
    .getByRole('textbox', { name: 'Session label', exact: true })
    .fill('Account A')
  return panel
}
const compose = async (
  panel: Page,
  name: string,
  parameters: unknown[] = [],
) => {
  await panel
    .getByRole('textbox', { name: 'Method or publication name', exact: true })
    .fill(name)
  await panel
    .getByRole('textbox', {
      name: 'Parameters (encoded EJSON array)',
      exact: true,
    })
    .fill(JSON.stringify(parameters))
}
const databaseRecords = (
  panel: Page,
): Promise<{ cases: SavedCase[]; snapshots: SavedSnapshot[] }> =>
  panel.evaluate(async database => {
    const databases = await indexedDB.databases()
    if (!databases.some(item => item.name === database))
      return { cases: [], snapshots: [] }
    return new Promise<{ cases: SavedCase[]; snapshots: SavedSnapshot[] }>(
      (resolve, reject) => {
        const request = indexedDB.open(database)
        request.addEventListener('error', () => reject(request.error))
        request.onsuccess = () => {
          const db = request.result
          if (
            !db.objectStoreNames.contains('cases') ||
            !db.objectStoreNames.contains('snapshots')
          ) {
            db.close()
            resolve({ cases: [], snapshots: [] })
            return
          }
          const transaction = db.transaction(['cases', 'snapshots'], 'readonly')
          const cases = transaction.objectStore('cases').getAll()
          const snapshots = transaction.objectStore('snapshots').getAll()
          transaction.oncomplete = () => {
            db.close()
            resolve({
              cases: cases.result as SavedCase[],
              snapshots: snapshots.result as SavedSnapshot[],
            })
          }
          transaction.addEventListener('error', () => {
            db.close()
            reject(transaction.error)
          })
        }
      },
    )
  }, DATABASE)

test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus || page.isClosed()) return
  const run = await latest(page).catch(() => {})
  await info.attach('last-playground-run', {
    body: JSON.stringify(run ?? null, null, 2),
    contentType: 'application/json',
  })
})

test('manual composer dispatches only on Run and correlates selected connections', async ({
  page,
  extensionWorker,
  extensionId,
}) => {
  const panel = await openPanel(page, extensionWorker, extensionId)
  await page.evaluate(() =>
    (
      globalThis as unknown as InspectedRuntime
    ).__meteorDevtoolsPlaygroundFixture.login('Account A'),
  )
  await compose(panel, 'playground.identity')
  expect(await records(page)).toHaveLength(0)
  await panel.getByRole('button', { name: 'Run method', exact: true }).click()
  const first = await settled(page)
  expect(first.request.connectionId).toBe('default')
  expect(first.evidence.data.result).toEqual(
    expect.objectContaining({ userId: 'playground-account-1' }),
  )
  expect(first.method?.writesReflected).toBe(true)
  await panel
    .getByRole('combobox', { name: 'Target connection', exact: true })
    .selectOption('connection-1')
  await panel.getByRole('button', { name: 'Run method', exact: true }).click()
  const second = await settled(page, first.request.requestId)
  expect(second.request.connectionId).toBe('connection-1')
  expect(second.evidence.data.result).toEqual(
    expect.objectContaining({ userId: null }),
  )
  expect(second.method?.methodId).toBeDefined()
})

test('shared publication stop leaves an identical application subscription alive', async ({
  page,
  extensionWorker,
  extensionId,
}) => {
  const panel = await openPanel(page, extensionWorker, extensionId)
  const appId = await page.evaluate(
    () =>
      (globalThis as unknown as InspectedRuntime).Meteor.connection.subscribe(
        'fixture.empty',
      ).subscriptionId,
  )
  await panel
    .getByRole('combobox', { name: 'Operation', exact: true })
    .selectOption('subscription')
  await compose(panel, 'fixture.empty')
  await panel
    .getByRole('button', { name: 'Start publication probe', exact: true })
    .click()
  await expect
    .poll(() =>
      latest(page).then(run => ({ phase: run?.phase, reasons: run?.reasons })),
    )
    .toMatchObject({ phase: 'ready' })
    .catch(async () => {
      const run = await latest(page)
      throw new Error(
        `Publication did not become ready: ${JSON.stringify({ phase: run?.phase, reasons: run?.reasons })}`,
      )
    })
  const readyRun = await latest(page)
  const ownId = readyRun?.subscriptionId
  expect(ownId).not.toBe(appId)
  await panel
    .getByRole('button', { name: 'Stop local waiting', exact: true })
    .click()
  await settled(page)
  const ids = await page.evaluate(() =>
    Object.keys(
      (globalThis as unknown as InspectedRuntime).Meteor.connection
        ._subscriptions,
    ),
  )
  expect(ids).toContain(appId)
  expect(ids).not.toContain(ownId)
})

test('isolated anonymous and explicit session reuse preserve identity and credential boundaries', async ({
  page,
  extensionWorker,
  extensionId,
}) => {
  const panel = await openPanel(page, extensionWorker, extensionId)
  await page.evaluate(async () => {
    const scope = globalThis as unknown as InspectedRuntime
    await scope.__meteorDevtoolsPlaygroundFixture.login('Account A')
    // Drain the ordinary app login's already-posted capture before auditing internal reuse.
    await new Promise<void>(resolve => {
      const marker = crypto.randomUUID()
      const receive = (event: MessageEvent<unknown>) => {
        if (event.source === globalThis.window && event.data === marker) {
          globalThis.removeEventListener('message', receive)
          resolve()
        }
      }
      globalThis.addEventListener('message', receive)
      globalThis.postMessage(marker, '*')
    })
    scope.__playgroundCaptured = []
  })
  await compose(panel, 'playground.identity')
  await panel
    .getByRole('combobox', { name: 'Execution mode', exact: true })
    .selectOption('isolated')
  await panel.getByRole('button', { name: 'Run method', exact: true }).click()
  const anonymous = await settled(page)
  expect(anonymous.evidence.data.result).toEqual(
    expect.objectContaining({ userId: null }),
  )
  await panel
    .getByRole('combobox', { name: 'Isolated authentication', exact: true })
    .selectOption('reuse')
  await panel.getByRole('button', { name: 'Run method', exact: true }).click()
  const reused = await settled(page, anonymous.request.requestId)
  expect(reused.evidence.data.result).toEqual(
    expect.objectContaining({ userId: 'playground-account-1' }),
  )
  expect(
    await page.evaluate(() => {
      const scope = globalThis as unknown as InspectedRuntime
      const token = scope.Accounts._storedLoginToken()
      return Boolean(
        token && JSON.stringify(scope.__playgroundCaptured).includes(token),
      )
    }),
  ).toBe(false)
})

test('isolated publication retains readiness documents and ambient attribution caveat', async ({
  page,
  extensionWorker,
  extensionId,
}) => {
  const panel = await openPanel(page, extensionWorker, extensionId)
  await panel
    .getByRole('combobox', { name: 'Operation', exact: true })
    .selectOption('subscription')
  await panel
    .getByRole('combobox', { name: 'Execution mode', exact: true })
    .selectOption('isolated')
  await compose(panel, 'playground.documents', ['playground-account-1', false])
  await panel
    .getByRole('button', { name: 'Start publication probe', exact: true })
    .click()
  await expect
    .poll(() =>
      latest(page).then(run => ({ phase: run?.phase, reasons: run?.reasons })),
    )
    .toMatchObject({ phase: 'ready' })
    .catch(async () => {
      const run = await latest(page)
      throw new Error(
        `Publication did not become ready: ${JSON.stringify({ phase: run?.phase, reasons: run?.reasons })}`,
      )
    })
  const run = await latest(page)
  expect(run?.readiness?.documentBaseline).toBe('known')
  expect(run?.readiness?.data.documents).toHaveProperty('playground_documents')
  expect(run?.reasons.join(' ')).toContain('Ambient')
  await panel
    .getByRole('button', { name: 'Stop local waiting', exact: true })
    .click()
  const stoppedRun = await settled(page)
  expect(stoppedRun.readiness).toEqual(run?.readiness)
})

test('real IndexedDB saves reviewed immutable snapshots and imports new local IDs', async ({
  page,
  extensionWorker,
  extensionId,
}) => {
  const panel = await openPanel(page, extensionWorker, extensionId)
  await compose(panel, 'fixture.echo', [{ nested: { value: 42 } }])
  await panel
    .getByText('Case metadata, expectations, and comparison exclusions', {
      exact: true,
    })
    .click()
  await panel
    .getByRole('textbox', { name: 'Case title', exact: true })
    .fill('Portable echo case')
  await panel
    .getByRole('button', { name: 'Review case to save', exact: true })
    .click()
  await panel
    .getByRole('button', { name: 'Confirm reviewed case save', exact: true })
    .click()
  await expect
    .poll(() => databaseRecords(panel).then(data => data.cases.length))
    .toBe(1)
  await panel.getByRole('button', { name: 'Run method', exact: true }).click()
  await settled(page)
  await panel
    .getByRole('button', { name: 'Review snapshot to save', exact: true })
    .click()
  const beforeSnapshot = await databaseRecords(panel)
  expect(beforeSnapshot.snapshots).toHaveLength(0)
  await panel
    .getByRole('button', {
      name: 'Confirm reviewed snapshot save',
      exact: true,
    })
    .click()
  await expect
    .poll(() => databaseRecords(panel).then(data => data.snapshots.length))
    .toBe(1)
  const before = await databaseRecords(panel)
  await panel.getByRole('checkbox', { name: /Portable echo case/ }).check()
  await panel
    .getByRole('checkbox', { name: /Account A · fixture.echo/ })
    .check()
  await panel
    .getByRole('button', { name: 'Review selected export', exact: true })
    .click()
  await expect(panel.getByLabel('Reviewed transfer preview')).toContainText(
    'meteor-devtools-playground',
  )
  const downloadPromise = panel.waitForEvent('download')
  await panel
    .getByRole('button', { name: 'Confirm reviewed export', exact: true })
    .click()
  const download = await downloadPromise
  const downloadPath = await download.path()
  if (!downloadPath) throw new Error('Reviewed export download unavailable.')
  const exported = await readFile(downloadPath, 'utf8')
  await panel
    .getByLabel('Import playground file', { exact: true })
    .setInputFiles({
      name: 'portable.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exported),
    })
  const beforeImport = await databaseRecords(panel)
  expect(beforeImport.cases).toHaveLength(1)
  await panel
    .getByRole('button', { name: 'Confirm reviewed import', exact: true })
    .click()
  await expect
    .poll(() => databaseRecords(panel).then(data => data.cases.length))
    .toBe(2)
  const after = await databaseRecords(panel)
  expect(after.snapshots).toHaveLength(2)
  expect(
    after.snapshots.find(snapshot => snapshot.id === before.snapshots[0]?.id),
  ).toEqual(before.snapshots[0])
  expect(new Set(after.snapshots.map(snapshot => snapshot.id)).size).toBe(2)
  await panel
    .getByRole('combobox', { name: 'Baseline snapshot', exact: true })
    .selectOption(after.snapshots[0]!.id)
  await panel
    .getByRole('combobox', { name: 'Comparison snapshot', exact: true })
    .selectOption(after.snapshots[1]!.id)
  await expect(panel.getByLabel('Structured comparison')).toContainText(
    '"status": "equal"',
  )
  const afterImportRuns = await records(page)
  expect(new Set(afterImportRuns.map(run => run.request.requestId)).size).toBe(
    1,
  )
})

test('parameter matrices preview first, execute sequentially, and reject excess variants', async ({
  page,
  extensionWorker,
  extensionId,
}) => {
  const panel = await openPanel(page, extensionWorker, extensionId)
  await compose(panel, 'fixture.echo', [{ value: 0 }])
  const definition = {
    includeBaseline: true,
    changes: [
      {
        path: '/0/value',
        candidates: [
          { kind: 'value', value: 1 },
          { kind: 'value', value: 2 },
        ],
      },
    ],
  }
  await panel
    .getByRole('textbox', { name: 'Matrix definition (JSON)', exact: true })
    .fill(JSON.stringify(definition))
  await panel
    .getByRole('button', { name: 'Preview variants', exact: true })
    .click()
  expect(await records(page)).toHaveLength(0)
  await panel
    .getByRole('button', { name: 'Start reviewed matrix', exact: true })
    .click()
  await expect
    .poll(async () => {
      const items = await records(page)
      return new Set(
        items.filter(run => run.finished).map(run => run.request.requestId),
      ).size
    })
    .toBe(3)
  const captured = await records(page)
  const completed = [
    ...new Map(
      captured
        .filter(run => run.finished)
        .map(run => [run.request.requestId, run]),
    ).values(),
  ]
  for (let index = 1; index < completed.length; index++)
    expect(completed[index]!.startedAt).toBeGreaterThanOrEqual(
      completed[index - 1]!.method!.endedAt!,
    )
  await panel
    .getByRole('textbox', { name: 'Matrix definition (JSON)', exact: true })
    .fill(
      JSON.stringify({
        includeBaseline: true,
        changes: [
          {
            path: '/0/value',
            candidates: Array.from({ length: 21 }, (_, index) => ({
              kind: 'value',
              value: index + 1,
            })),
          },
        ],
      }),
    )
  await panel
    .getByRole('button', { name: 'Preview variants', exact: true })
    .click()
  await expect(
    panel.getByText(/Matrix exceeds the 20 variant limit/),
  ).toBeVisible()
  const afterExcess = await records(page)
  expect(new Set(afterExcess.map(run => run.request.requestId)).size).toBe(3)
})

test('readiness timeout stops the probe and navigation never reruns a draft', async ({
  page,
  extensionWorker,
  extensionId,
}) => {
  const panel = await openPanel(page, extensionWorker, extensionId)
  await panel
    .getByRole('combobox', { name: 'Operation', exact: true })
    .selectOption('subscription')
  await panel
    .getByRole('spinbutton', { name: 'Local wait timeout (ms)', exact: true })
    .fill('1000')
  await compose(panel, 'playground.neverReady')
  await panel
    .getByRole('button', { name: 'Start publication probe', exact: true })
    .click()
  const run = await settled(page)
  expect(run.phase).toBe('timed-out')
  const ids = await page.evaluate(() =>
    Object.keys(
      (globalThis as unknown as InspectedRuntime).Meteor.connection
        ._subscriptions,
    ),
  )
  expect(ids).not.toContain(run.subscriptionId)
  await page.reload()
  await page.evaluate(() =>
    (
      globalThis as unknown as InspectedRuntime
    ).__meteorDevtoolsFixture.waitUntilReady(),
  )
  await expect(
    panel
      .getByRole('status')
      .filter({ hasText: 'Inspected page session ready' }),
  ).toBeVisible()
  expect(await records(page)).toHaveLength(0)
  await expect(
    panel.getByRole('button', { name: 'Start publication probe', exact: true }),
  ).toBeDisabled()
})

test('reviewed import exceeding storage quota rolls back both IndexedDB tables', async ({
  page,
  extensionWorker,
  extensionId,
}) => {
  const panel = await openPanel(page, extensionWorker, extensionId)
  await compose(panel, 'fixture.echo', [{ value: 1 }])
  await panel
    .getByRole('button', { name: 'Review case to save', exact: true })
    .click()
  await panel
    .getByRole('button', { name: 'Confirm reviewed case save', exact: true })
    .click()
  await expect
    .poll(() => databaseRecords(panel).then(data => data.cases.length))
    .toBe(1)
  await panel.getByRole('button', { name: 'Run method', exact: true }).click()
  await settled(page)
  await panel
    .getByRole('button', { name: 'Review snapshot to save', exact: true })
    .click()
  await panel
    .getByRole('button', {
      name: 'Confirm reviewed snapshot save',
      exact: true,
    })
    .click()
  await expect
    .poll(() => databaseRecords(panel).then(data => data.snapshots.length))
    .toBe(1)
  const original = await databaseRecords(panel)
  // Procedurally fill the fixture boundary; the import itself uses the real reviewed UI transaction.
  await panel.evaluate(
    ({ database, seed }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(database)
        request.addEventListener('error', () => reject(request.error))
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction('cases', 'readwrite')
          for (let index = 1; index < 200; index++)
            transaction.objectStore('cases').add({
              ...(JSON.parse(seed) as SavedCase),
              id: `quota-seed-${index}`,
            })
          transaction.oncomplete = () => {
            db.close()
            resolve()
          }
          transaction.addEventListener('error', () => {
            db.close()
            reject(transaction.error)
          })
        }
      }),
    { database: DATABASE, seed: JSON.stringify(original.cases[0]) },
  )
  const file = {
    format: 'meteor-devtools-playground',
    version: 1,
    exportedAt: Date.now(),
    ...original,
  }
  await panel
    .getByLabel('Import playground file', { exact: true })
    .setInputFiles({
      name: 'quota.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(file)),
    })
  await panel
    .getByRole('button', { name: 'Confirm reviewed import', exact: true })
    .click()
  await expect(panel.getByText(/Saved record limit exceeded/)).toBeVisible()
  const after = await databaseRecords(panel)
  expect(after.cases).toHaveLength(200)
  expect(after.snapshots).toEqual(original.snapshots)
})

test('composer preserves EJSON dates, binary data and non-finite values through the server', async ({
  page,
  extensionWorker,
  extensionId,
}) => {
  const panel = await openPanel(page, extensionWorker, extensionId)
  const payload = {
    date: { $date: Date.UTC(2024, 5, 15) },
    binary: {
      $binary: Buffer.from(
        Array.from({ length: 6 }, (_, index) => index),
      ).toString('base64'),
    },
    positiveInfinity: { $InfNaN: 1 },
    negativeInfinity: { $InfNaN: -1 },
    notANumber: { $InfNaN: 0 },
  }
  await compose(panel, 'fixture.echo', [payload])
  await panel.getByRole('button', { name: 'Run method', exact: true }).click()
  const run = await settled(page)
  const expected =
    fixture.id === 'devapp-2.16'
      ? payload
      : expect.objectContaining({ payload })
  expect(run.evidence.data.result).toEqual(expected)
  expect(run.method?.writesReflected).toBe(true)
})

test('duplicate commands and Stop never repeat a dispatched server invocation', async ({
  page,
  extensionWorker,
  extensionId,
}) => {
  const panel = await openPanel(page, extensionWorker, extensionId)
  const key = crypto.randomUUID()
  await compose(panel, 'playground.delayed', [key, 2000])
  await panel.getByRole('button', { name: 'Run method', exact: true }).click()
  await expect
    .poll(() => latest(page).then(run => Boolean(run?.method?.methodId)))
    .toBe(true)
  const invoked = await latest(page)
  if (!invoked) throw new Error('Expected dispatched method.')
  await page.evaluate(serialized => {
    const scope = globalThis as unknown as {
      __meteor_devtools_evolved_receiveMessage(message: unknown): void
    }
    scope.__meteor_devtools_evolved_receiveMessage({
      source: 'meteor-devtools-evolved',
      eventType: 'playground:command',
      data: JSON.parse(serialized) as unknown,
    })
  }, JSON.stringify(invoked.request))
  await panel
    .getByRole('button', { name: 'Stop local waiting', exact: true })
    .click()
  const stopped = await settled(page)
  expect(stopped.phase).toBe('stopped')
  await expect
    .poll(() => latest(page).then(run => run?.method?.lateEvidence))
    .toBe(true)
  const count = await page.evaluate(
    counterKey =>
      new Promise<unknown>((resolve, reject) => {
        const scope = globalThis as unknown as InspectedRuntime
        scope.Meteor.connection.apply(
          'playground.invocations',
          [counterKey],
          { noRetry: true },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          },
        )
      }),
    key,
  )
  expect(count).toBe(1)
  const all = await records(page)
  expect(new Set(all.map(run => run.request.requestId)).size).toBe(1)
})

test('separate browser profiles exchange a case and compare labeled account snapshots', async ({
  page,
  extensionWorker,
  extensionId,
}) => {
  test.setTimeout(60_000)
  const panelA = await openPanel(page, extensionWorker, extensionId)
  await page.evaluate(() =>
    (
      globalThis as unknown as InspectedRuntime
    ).__meteorDevtoolsPlaygroundFixture.login('Account A'),
  )
  await compose(panelA, 'playground.access', ['playground-account-1', true])
  await panelA
    .getByText('Case metadata, expectations, and comparison exclusions', {
      exact: true,
    })
    .click()
  await panelA
    .getByRole('textbox', { name: 'Case title', exact: true })
    .fill('Shared account comparison')
  await panelA
    .getByRole('button', { name: 'Review case to save', exact: true })
    .click()
  await panelA
    .getByRole('button', { name: 'Confirm reviewed case save', exact: true })
    .click()
  await panelA.getByRole('button', { name: 'Run method', exact: true }).click()
  const runA = await settled(page)
  expect(runA.evidence.outcome).toBe('success')
  await panelA
    .getByRole('button', { name: 'Review snapshot to save', exact: true })
    .click()
  await panelA
    .getByRole('button', {
      name: 'Confirm reviewed snapshot save',
      exact: true,
    })
    .click()
  await expect
    .poll(() => databaseRecords(panelA).then(data => data.snapshots.length))
    .toBe(1)
  await panelA
    .getByRole('checkbox', { name: /Shared account comparison/ })
    .check()
  await panelA
    .getByRole('checkbox', { name: /Account A · playground.access/ })
    .check()
  await panelA
    .getByRole('button', { name: 'Review selected export', exact: true })
    .click()
  const downloading = panelA.waitForEvent('download')
  await panelA
    .getByRole('button', { name: 'Confirm reviewed export', exact: true })
    .click()
  const download = await downloading
  const filePath = await download.path()
  if (!filePath) throw new Error('Account A export unavailable.')
  const exported = await readFile(filePath, 'utf8')
  const contextB = await launchExtensionContext()
  try {
    const workerB =
      contextB.serviceWorkers()[0] ??
      (await contextB.waitForEvent('serviceworker'))
    const pageB = contextB.pages()[0] ?? (await contextB.newPage())
    const panelB = await openPanel(
      pageB,
      workerB,
      new URL(workerB.url()).hostname,
    )
    const initialB = await databaseRecords(panelB)
    expect(initialB.cases).toHaveLength(0)
    await pageB.evaluate(() =>
      (
        globalThis as unknown as InspectedRuntime
      ).__meteorDevtoolsPlaygroundFixture.login('Account B'),
    )
    await panelB
      .getByLabel('Import playground file', { exact: true })
      .setInputFiles({
        name: 'account-a.json',
        mimeType: 'application/json',
        buffer: Buffer.from(exported),
      })
    await panelB
      .getByRole('button', { name: 'Confirm reviewed import', exact: true })
      .click()
    await expect
      .poll(() => databaseRecords(panelB).then(data => data.cases.length))
      .toBe(1)
    expect(await records(pageB)).toHaveLength(0)
    await panelB
      .getByRole('button', { name: 'Load into editor', exact: true })
      .click()
    await panelB
      .getByRole('combobox', { name: 'Target connection', exact: true })
      .selectOption('default')
    await panelB
      .getByRole('textbox', { name: 'Session label', exact: true })
      .fill('Account B')
    await panelB
      .getByRole('button', { name: 'Run method', exact: true })
      .click()
    const runB = await settled(pageB)
    expect(runB.evidence.outcome).toBe('error')
    expect(runB.evidence.data.error).toEqual(
      expect.objectContaining({ error: 'playground-forbidden' }),
    )
    await panelB
      .getByRole('button', { name: 'Review snapshot to save', exact: true })
      .click()
    await panelB
      .getByRole('button', {
        name: 'Confirm reviewed snapshot save',
        exact: true,
      })
      .click()
    await expect
      .poll(() => databaseRecords(panelB).then(data => data.snapshots.length))
      .toBe(2)
    const destination = await databaseRecords(panelB)
    const snapshotA = destination.snapshots.find(
      snapshot => snapshot.request.sessionLabel === 'Account A',
    )
    const snapshotB = destination.snapshots.find(
      snapshot => snapshot.request.sessionLabel === 'Account B',
    )
    expect(snapshotA?.caseId).toBe(snapshotB?.caseId)
    expect(snapshotA?.caseRevision).toBe(snapshotB?.caseRevision)
    await panelB
      .getByRole('combobox', { name: 'Baseline snapshot', exact: true })
      .selectOption(snapshotA!.id)
    await panelB
      .getByRole('combobox', { name: 'Comparison snapshot', exact: true })
      .selectOption(snapshotB!.id)
    await expect(panelB.getByLabel('Structured comparison')).toContainText(
      '"status": "different"',
    )
  } finally {
    await contextB.close()
  }
})

test('captured and bookmarked Edit actions open passive connection-aware drafts', async ({
  page,
  extensionWorker,
  extensionId,
}) => {
  const panel = await openPanel(page, extensionWorker, extensionId)
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const scope = globalThis as unknown as InspectedRuntime
        scope.Meteor.connection.apply(
          'fixture.echo',
          [{ captured: 'bookmark example' }],
          { noRetry: true },
          error => {
            if (error) reject(error)
            else resolve()
          },
        )
      }),
  )
  await panel.getByRole('button', { name: 'DDP', exact: true }).click()
  await panel
    .getByRole('textbox', { name: 'Search...', exact: true })
    .fill('fixture.echo')
  const captured = panel
    .locator('.group:visible')
    .filter({ hasText: 'fixture.echo' })
    .first()
  await captured.hover()
  await captured
    .getByRole('button', { name: 'Edit in DDP Playground', exact: true })
    .click()
  await expect(
    panel.getByRole('textbox', {
      name: 'Method or publication name',
      exact: true,
    }),
  ).toHaveValue('fixture.echo')
  expect(await records(page)).toHaveLength(0)
  await panel.getByRole('button', { name: 'DDP', exact: true }).click()
  await captured.hover()
  await captured.locator('[data-icon="star-empty"]').click()
  await panel.getByRole('button', { name: 'Bookmarks', exact: true }).click()
  const bookmarked = panel
    .locator('.group:visible')
    .filter({ hasText: 'fixture.echo' })
    .first()
  await bookmarked.hover()
  await bookmarked
    .getByRole('button', { name: 'Edit in DDP Playground', exact: true })
    .click()
  await expect(
    panel.getByRole('textbox', {
      name: 'Parameters (encoded EJSON array)',
      exact: true,
    }),
  ).toHaveValue(/bookmark example/)
  expect(await records(page)).toHaveLength(0)
  await panel.getByRole('button', { name: 'Run method', exact: true }).click()
  const run = await settled(page)
  expect(run.request.connectionId).toBe('default')
  expect(run.evidence.outcome).toBe('success')
})

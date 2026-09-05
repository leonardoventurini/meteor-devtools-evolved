import { expect, test } from './fixtures'
import { resolveMeteorFixture } from './MeteorFixtures'

const fixture = resolveMeteorFixture()
const ECHO_METHOD = 'fixture.echo'
const EMPTY_PUBLICATION = 'fixture.empty'

type Callback = (error: unknown, result?: unknown) => void
interface Frame {
  msg?: string
  id?: string
  methods?: string[]
  method?: string
}
interface MethodInvoker {
  methodId: string
  noRetry: boolean
  _onResultReceived: Callback
}
interface SubscriptionHandle {
  subscriptionId: string
  ready(): boolean
  stop(): void
}
interface Connection {
  _lastSessionId: string | null
  _methodInvokers: Record<string, MethodInvoker>
  _subscriptions: Record<string, unknown>
  _stream: {
    on(event: 'message', callback: (raw: string) => void): void
    send(raw: string): unknown
  }
  apply(
    name: string,
    args: unknown[],
    options: {
      noRetry: boolean
      onResultReceived: Callback
      returnServerResultPromise?: boolean
    },
    callback: Callback,
  ): unknown
  applyAsync(
    name: string,
    args: unknown[],
    options: {
      noRetry: boolean
      onResultReceived: Callback
      returnServerResultPromise?: boolean
    },
    callback: Callback,
  ): Promise<unknown>
  subscribe(name: string): SubscriptionHandle
  status(): { connected: boolean; status: string }
  disconnect(): void
  reconnect(): void
}
interface Runtime {
  Package: {
    ejson: {
      EJSON: {
        equals(left: unknown, right: unknown): boolean
        newBinary(length: number): Uint8Array
      }
    }
  }
  Meteor: { release: string; connection: Connection }
  DDP: { connect(url: string): Connection }
  __meteorDevtoolsFixture: { waitUntilReady(): Promise<unknown> }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(fixture.readinessText)).toBeVisible()
  await page.evaluate(async () => {
    await (
      globalThis as unknown as Runtime
    ).__meteorDevtoolsFixture.waitUntilReady()
  })
  expect(
    await page.evaluate(
      () => (globalThis as unknown as Runtime).Meteor.release,
    ),
  ).toBe(fixture.release)
})

test('allocates distinct synchronous method IDs and correlates result and writes signals', async ({
  page,
}) => {
  const evidence = await page.evaluate(
    async ({ method }) => {
      const connection = (globalThis as unknown as Runtime).Meteor.connection
      const frames: Frame[] = []
      connection._stream.on('message', raw =>
        frames.push(JSON.parse(raw) as Frame),
      )
      const results: unknown[] = []
      const ids: string[] = []
      const noRetry: boolean[] = []
      const callbacks = Array.from(
        { length: 2 },
        () =>
          new Promise<void>((resolve, reject) => {
            const onResultReceived: Callback = error => {
              if (error) reject(error)
            }
            connection.apply(
              method,
              [{ compatibility: true }],
              { noRetry: true, onResultReceived },
              (error, result) => {
                if (error) {
                  reject(error)
                  return
                }
                results.push(result)
                resolve()
              },
            )
            // Callback identity belongs to this invocation even when names/arguments match.
            const invokers = Object.values(connection._methodInvokers).filter(
              invoker => invoker._onResultReceived === onResultReceived,
            )
            const invoker = invokers[0]
            if (invokers.length !== 1 || !invoker) {
              reject(new Error('Expected one synchronously allocated invoker'))
              return
            }
            ids.push(invoker.methodId)
            noRetry.push(invoker.noRetry)
          }),
      )
      await Promise.all(callbacks)
      return {
        ids,
        noRetry,
        results,
        signals: ids.map(id => ({
          result: frames.some(
            frame => frame.msg === 'result' && frame.id === id,
          ),
          updated: frames.some(
            frame => frame.msg === 'updated' && frame.methods?.includes(id),
          ),
        })),
      }
    },
    { method: ECHO_METHOD },
  )
  expect(new Set(evidence.ids).size).toBe(2)
  expect(evidence.noRetry).toEqual([true, true])
  expect(evidence.results).toHaveLength(2)
  expect(evidence.signals).toEqual([
    { result: true, updated: true },
    { result: true, updated: true },
  ])
})

test('preserves applyAsync callback identity and noRetry through the async dispatch queue', async ({
  page,
}) => {
  const evidence = await page.evaluate(
    async ({ method }) => {
      const connection = (globalThis as unknown as Runtime).Meteor.connection
      const invokers: Array<{ id: string; noRetry: boolean }> = []
      const emittedIds: string[] = []
      const emittedNoRetry: boolean[] = []
      const callbacks = new Set<Callback>()
      const originalSend = connection._stream.send
      connection._stream.send = raw => {
        const frame = JSON.parse(raw) as Frame
        const invoker = frame.id
          ? connection._methodInvokers[frame.id]
          : undefined
        if (
          frame.msg === 'method' &&
          invoker &&
          callbacks.has(invoker._onResultReceived)
        ) {
          emittedIds.push(invoker.methodId)
          emittedNoRetry.push(invoker.noRetry)
        }
        return originalSend.call(connection._stream, raw)
      }
      try {
        const requests = Array.from({ length: 2 }, () => {
          const onResultReceived: Callback = () => {
            const invoker = Object.values(connection._methodInvokers).find(
              candidate => candidate._onResultReceived === onResultReceived,
            )
            if (invoker)
              invokers.push({ id: invoker.methodId, noRetry: invoker.noRetry })
          }
          callbacks.add(onResultReceived)
          return new Promise<void>((resolve, reject) => {
            void connection
              .applyAsync(
                method,
                [{ compatibility: true }],
                {
                  noRetry: true,
                  onResultReceived,
                },
                error => {
                  if (error) {
                    reject(error)
                    return
                  }
                  resolve()
                },
              )
              .catch(reject)
          })
        })
        await Promise.all(requests)
        return { invokers, emittedIds, emittedNoRetry }
      } finally {
        connection._stream.send = originalSend
      }
    },
    { method: ECHO_METHOD },
  )
  expect(evidence.emittedNoRetry).toEqual([true, true])
  expect(evidence.invokers).toHaveLength(2)
  expect(new Set(evidence.invokers.map(invoker => invoker.id)).size).toBe(2)
  expect(evidence.invokers.every(invoker => invoker.noRetry)).toBe(true)
  expect(evidence.emittedIds.toSorted()).toEqual(
    evidence.invokers.map(invoker => invoker.id).toSorted(),
  )
})

test('stopping an identical nonreactive probe preserves the application subscription', async ({
  page,
}) => {
  const evidence = await page.evaluate(
    async ({ publication }) => {
      const connection = (globalThis as unknown as Runtime).Meteor.connection
      const app = connection.subscribe(publication)
      const probe = connection.subscribe(publication)
      try {
        await new Promise<void>((resolve, reject) => {
          const deadline = Date.now() + 5000
          const check = () => {
            if (app.ready() && probe.ready()) {
              resolve()
              return
            }
            if (Date.now() > deadline) {
              reject(new Error('Subscriptions did not become ready'))
              return
            }
            setTimeout(check, 10)
          }
          check()
        })
        probe.stop()
        return {
          distinct: app.subscriptionId !== probe.subscriptionId,
          appReady: app.ready(),
          appPresent: Object.hasOwn(
            connection._subscriptions,
            app.subscriptionId,
          ),
          probePresent: Object.hasOwn(
            connection._subscriptions,
            probe.subscriptionId,
          ),
          appConnected: connection.status().connected,
        }
      } finally {
        probe.stop()
        app.stop()
      }
    },
    { publication: EMPTY_PUBLICATION },
  )
  expect(evidence).toEqual({
    distinct: true,
    appReady: true,
    appPresent: true,
    probePresent: false,
    appConnected: true,
  })
})

test('opens and disposes a dedicated DDP connection without disconnecting the app', async ({
  page,
}) => {
  const evidence = await page.evaluate(async () => {
    const runtime = globalThis as unknown as Runtime
    const owned = runtime.DDP.connect(location.origin)
    try {
      await new Promise<void>((resolve, reject) => {
        const deadline = Date.now() + 5000
        const check = () => {
          if (owned.status().connected) {
            resolve()
            return
          }
          if (Date.now() > deadline) {
            reject(new Error('Owned connection did not connect'))
            return
          }
          setTimeout(check, 10)
        }
        check()
      })
      const distinct = owned !== runtime.Meteor.connection
      owned.disconnect()
      return {
        distinct,
        ownedConnected: owned.status().connected,
        ownedStatus: owned.status().status,
        appConnected: runtime.Meteor.connection.status().connected,
      }
    } finally {
      owned.disconnect()
    }
  })
  expect(evidence).toEqual({
    distinct: true,
    ownedConnected: false,
    ownedStatus: 'offline',
    appConnected: true,
  })
})

test('round trips generated standard EJSON values through the real selected connection', async ({
  page,
}) => {
  const matches = await page.evaluate(
    async ({ method, wrapped }) => {
      const runtime = globalThis as unknown as Runtime
      const binary = runtime.Package.ejson.EJSON.newBinary(16)
      for (let index = 0; index < binary.length; index++)
        binary[index] = index * 11
      const payload = {
        dates: Array.from(
          { length: 4 },
          (_, index) => new Date(Date.UTC(2024, index, index + 1)),
        ),
        binary,
        numbers: [
          Number.NaN,
          Number.POSITIVE_INFINITY,
          Number.NEGATIVE_INFINITY,
        ],
        nested: Array.from({ length: 4 }, (_, index) => ({
          index,
          value: index % 2 ? null : true,
        })),
      }
      const result = await new Promise<unknown>((resolve, reject) => {
        runtime.Meteor.connection.apply(
          method,
          [payload],
          { noRetry: true, onResultReceived: () => {} },
          (error, response) => {
            if (error) {
              reject(error)
              return
            }
            resolve(response)
          },
        )
      })
      return wrapped
        ? typeof result === 'object' &&
            result !== null &&
            'payload' in result &&
            runtime.Package.ejson.EJSON.equals(payload, result.payload)
        : runtime.Package.ejson.EJSON.equals(payload, result)
    },
    { method: ECHO_METHOD, wrapped: fixture.id === 'devapp-3.5' },
  )
  expect(matches).toBe(true)
})

test('noRetry prevents server re-execution after an interrupted owned connection starts a new session', async ({
  page,
}) => {
  const evidence = await page.evaluate(async () => {
    const runtime = globalThis as unknown as Runtime
    const owned = runtime.DDP.connect(location.origin)
    const key = crypto.randomUUID()
    // eslint-disable-next-line unicorn/consistent-function-scoping -- Evaluated functions cannot capture Node helpers.
    const invoke = (connection: Connection, method: string, args: unknown[]) =>
      new Promise<unknown>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`No result received for ${method}`)),
          8000,
        )
        const onResultReceived: Callback = (error, result) => {
          clearTimeout(timer)
          if (error) {
            reject(error)
            return
          }
          resolve(result)
        }
        connection.apply(
          method,
          args,
          { noRetry: true, onResultReceived },
          (error, result) => {
            if (error) {
              reject(error)
              return
            }
            resolve(result)
          },
        )
      })
    // eslint-disable-next-line unicorn/consistent-function-scoping -- This helper executes inside the browser.
    const until = async (predicate: () => Promise<boolean>) => {
      const deadline = Date.now() + 5000
      while (!(await predicate())) {
        if (Date.now() > deadline)
          throw new Error('Compatibility condition timed out')
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
    try {
      await until(async () => owned.status().connected)
      const interrupted = invoke(owned, 'playground.delayed', [key, 3000]).then(
        () => 'unexpected-success',
        (error: unknown) =>
          typeof error === 'object' && error !== null && 'error' in error
            ? error.error
            : 'unknown-error',
      )
      await until(
        async () =>
          (await invoke(runtime.Meteor.connection, 'playground.invocations', [
            key,
          ])) === 1,
      )
      owned.disconnect()
      // Force a new DDP session to exercise the resend path, not session resumption.
      owned._lastSessionId = null
      owned.reconnect()
      const error = await interrupted
      await until(async () => owned.status().connected)
      await invoke(owned, 'playground.identity', [])
      return {
        error,
        count: await invoke(
          runtime.Meteor.connection,
          'playground.invocations',
          [key],
        ),
        appConnected: runtime.Meteor.connection.status().connected,
      }
    } finally {
      owned.disconnect()
    }
  })
  expect(evidence).toEqual({
    error: 'invocation-failed',
    count: 1,
    appConnected: true,
  })
})

import { expect, test } from './fixtures'
import { resolveMeteorFixture } from './MeteorFixtures'

type Callback = (error: unknown, result?: unknown) => void
interface Connection {
  _stream: { rawUrl: string }
  apply(
    name: string,
    args: unknown[],
    options: { noRetry: boolean },
    callback: Callback,
  ): unknown
  disconnect(options: { _permanent: boolean }): void
  status(): { connected: boolean; status: string }
  userId(): string | null
}
interface Runtime {
  Meteor: { connection: Connection; release: string }
  DDP: { connect(endpoint: string, options: { retry: boolean }): Connection }
  Accounts: {
    connection: Connection
    _storedLoginToken(): string | null
    _storedUserId(): string | null
  }
  __meteorDevtoolsFixture: { waitUntilReady(): Promise<unknown> }
  __meteorDevtoolsPlaygroundFixture: {
    accountIds: string[]
    login(label: string): Promise<string>
    logout(): Promise<null>
  }
}

const fixture = resolveMeteorFixture()

test('supports real Accounts resume without changing source credentials on both fixture accounts', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByText(fixture.readinessText)).toBeVisible()
  const evidence = await page.evaluate(async () => {
    const runtime = globalThis as unknown as Runtime
    await runtime.__meteorDevtoolsFixture.waitUntilReady()
    const { Meteor, Accounts, DDP } = runtime
    const api = runtime.__meteorDevtoolsPlaygroundFixture
    const results = []
    // eslint-disable-next-line unicorn/consistent-function-scoping -- This helper executes in the browser evaluation realm.
    const invoke = (connection: Connection, name: string, args: unknown[]) =>
      new Promise<unknown>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error(`Timed out invoking ${name}`)),
          8000,
        )
        connection.apply(name, args, { noRetry: true }, (error, result) => {
          clearTimeout(timeout)
          if (error) reject(error)
          else resolve(result)
        })
      })
    for (const label of ['Account A', 'Account B']) {
      const userId = await Promise.race([
        api.login(label),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Login timeout: ${label}`)), 8000),
        ),
      ])
      const token = Accounts._storedLoginToken()
      if (!token) throw new Error('Standard Accounts token unavailable')
      const anonymous = DDP.connect(Meteor.connection._stream.rawUrl, {
        retry: false,
      })
      const reused = DDP.connect(Meteor.connection._stream.rawUrl, {
        retry: false,
      })
      try {
        for (const connection of [anonymous, reused]) {
          const deadline = Date.now() + 8000
          while (!connection.status().connected) {
            if (Date.now() > deadline)
              throw new Error(
                `Owned transport connection timeout: ${connection.status().status}`,
              )
            await new Promise(resolve => setTimeout(resolve, 20))
          }
        }
        const anonymousIdentity = await invoke(
          anonymous,
          'playground.identity',
          [],
        )
        const loginResult = (await invoke(reused, 'login', [
          { resume: token },
        ])) as { id?: string }
        const reusedIdentity = await invoke(reused, 'playground.identity', [])
        const sourceIdentity = await invoke(
          Meteor.connection,
          'playground.identity',
          [],
        )
        const otherUserId = api.accountIds.find(id => id !== userId)
        let denied = false
        try {
          await invoke(reused, 'playground.access', [otherUserId])
        } catch {
          denied = true
        }
        const permissive = await invoke(reused, 'playground.access', [
          otherUserId,
          false,
        ])
        let invalidResumeRejected = false
        try {
          await invoke(anonymous, 'login', [
            { resume: 'deliberately-invalid-fixture-token' },
          ])
        } catch {
          invalidResumeRejected = true
        }
        results.push({
          userId,
          anonymousIdentity,
          reusedIdentity,
          sourceIdentity,
          denied,
          permissive,
          resumedUserId: loginResult.id,
          invalidResumeRejected,
          associated: Accounts.connection === Meteor.connection,
          storedUserMatches: Accounts._storedUserId() === userId,
          tokenUnchanged: Accounts._storedLoginToken() === token,
        })
      } finally {
        anonymous.disconnect({ _permanent: true })
        reused.disconnect({ _permanent: true })
      }
      // Closing the isolated transport must not revoke the shared resume token.
      if (Accounts._storedLoginToken() !== token)
        throw new Error('Disposal changed source credentials')
      await Promise.race([
        api.logout(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Logout timeout')), 8000),
        ),
      ])
    }
    return { release: Meteor.release, results }
  })
  expect(evidence.release).toBe(fixture.release)
  expect(evidence.results).toHaveLength(2)
  expect(new Set(evidence.results.map(result => result.userId)).size).toBe(2)
  for (const result of evidence.results) {
    expect(result.anonymousIdentity).toMatchObject({ userId: null })
    expect(result.reusedIdentity).toMatchObject({ userId: result.userId })
    expect(result.sourceIdentity).toMatchObject({ userId: result.userId })
    expect(result.resumedUserId).toBe(result.userId)
    expect(result).toMatchObject({
      associated: true,
      storedUserMatches: true,
      tokenUnchanged: true,
      denied: true,
      invalidResumeRejected: true,
    })
    expect(result.permissive).toMatchObject({ viewedBy: result.userId })
  }
})

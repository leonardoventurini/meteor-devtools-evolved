import { afterEach, expect, it, vi } from 'vitest'
import { resolveSessionReuse } from '../src/Injectors/Playground/Authentication'

type Callback = (error?: unknown, result?: unknown) => void

const fixture = () => {
  const sourceConnection = {
    userId: () => 'account-a',
    status: () => ({ connected: true }),
    _stream: { rawUrl: 'https://fixture.test' },
  }
  const source = {
    id: 'default',
    displayName: 'Default',
    connection: sourceConnection,
  }
  const accounts = {
    connection: sourceConnection,
    _useHttpOnlyCookies: false,
    _lastLoginTokenWhenPolled: 'private-token',
    _storedLoginToken: () => 'private-token',
    _storedUserId: () => 'account-a',
    loggingIn: () => false,
  }
  const apply = vi.fn(
    (
      _name: string,
      _args: unknown[],
      options: { noRetry: true; onResultReceived: Callback },
      _callback: Callback,
    ) => {
      options.onResultReceived(undefined, {
        id: 'account-a',
        token: 'private-returned-token',
      })
    },
  )
  const owned = {
    id: 'owned',
    displayName: 'Owned',
    ownership: {
      parentConnectionId: source.id,
      requestId: 'request',
      panelSessionId: 'panel',
      pageEpoch: 'epoch',
    },
    connection: {
      _stream: { rawUrl: 'https://fixture.test' },
      status: () => ({ connected: true }),
      apply,
    },
  }
  return { source, accounts, owned, apply }
}

afterEach(() => vi.useRealTimers())

it('uses the selected owned transport, noRetry and only sanitized result identity', async () => {
  const { source, accounts, owned, apply } = fixture()
  const capability = resolveSessionReuse(source, accounts)
  expect(Object.keys(capability).toSorted()).toEqual([
    'authenticate',
    'dispose',
    'isCurrent',
    'userId',
  ])
  expect(capability.isCurrent()).toBe(true)
  expect(await capability.authenticate(owned)).toEqual({ userId: 'account-a' })
  expect(apply).toHaveBeenCalledWith(
    'login',
    [{ resume: 'private-token' }],
    expect.objectContaining({ noRetry: true }),
    expect.any(Function),
  )
  expect(JSON.stringify(capability)).not.toContain('private')
})

it.each([
  [
    'association',
    (value: ReturnType<typeof fixture>) => {
      value.accounts.connection = { ...value.source.connection }
    },
  ],
  [
    'stored identity',
    (value: ReturnType<typeof fixture>) => {
      value.accounts._storedUserId = () => 'other'
    },
  ],
  [
    'logging in',
    (value: ReturnType<typeof fixture>) => {
      value.accounts.loggingIn = () => true
    },
  ],
  [
    'HttpOnly',
    (value: ReturnType<typeof fixture>) => {
      value.accounts._useHttpOnlyCookies = true
    },
  ],
  [
    'missing token',
    (value: ReturnType<typeof fixture>) => {
      value.accounts._storedLoginToken = () => ''
    },
  ],
  [
    'stale token',
    (value: ReturnType<typeof fixture>) => {
      value.accounts._lastLoginTokenWhenPolled = 'other'
    },
  ],
])('rejects unavailable reuse: %s', (_name, mutate) => {
  const value = fixture()
  mutate(value)
  expect(() => resolveSessionReuse(value.source, value.accounts)).toThrow(
    /unavailable/,
  )
  expect(value.apply).not.toHaveBeenCalled()
})

it('detects account, token and endpoint changes without exposing credentials', async () => {
  for (const mutation of ['account', 'token', 'endpoint']) {
    const { source, accounts, owned, apply } = fixture()
    const capability = resolveSessionReuse(source, accounts)
    if (mutation === 'account') source.connection.userId = () => 'other'
    if (mutation === 'token')
      accounts._storedLoginToken = () => 'rotated-secret'
    if (mutation === 'endpoint')
      source.connection._stream.rawUrl = 'https://other.test'
    expect(capability.isCurrent()).toBe(false)
    await expect(capability.authenticate(owned)).rejects.toThrow(/changed/)
    expect(apply).not.toHaveBeenCalled()
  }
})

it('rejects wrong ownership, wrong endpoint and disconnected transport before login', async () => {
  for (const mutation of ['owner', 'endpoint', 'disconnected']) {
    const { source, accounts, owned, apply } = fixture()
    if (mutation === 'owner') owned.ownership.parentConnectionId = 'other'
    if (mutation === 'endpoint')
      owned.connection._stream.rawUrl = 'https://other.test'
    if (mutation === 'disconnected')
      owned.connection.status = () => ({ connected: false })
    await expect(
      resolveSessionReuse(source, accounts).authenticate(owned),
    ).rejects.toThrow()
    expect(apply).not.toHaveBeenCalled()
  }
})

it('sanitizes server failures and mismatched login identity', async () => {
  for (const failure of ['error', 'identity']) {
    const { source, accounts, owned, apply } = fixture()
    apply.mockImplementation((_name, _args, options) => {
      options.onResultReceived(
        failure === 'error' ? new Error('private-token') : undefined,
        { id: 'other', token: 'private-token' },
      )
    })
    await expect(
      resolveSessionReuse(source, accounts).authenticate(owned),
    ).rejects.toThrow(/authentication failed/)
  }
})

it('bounds local waiting and ignores late raw results', async () => {
  vi.useFakeTimers()
  const { source, accounts, owned, apply } = fixture()
  apply.mockImplementation(() => {})
  const promise = resolveSessionReuse(source, accounts, {
    timeoutMs: 50,
  }).authenticate(owned)
  const expectation = expect(promise).rejects.toThrow(/timed out/)
  await vi.advanceTimersByTimeAsync(50)
  await expectation
  expect(vi.getTimerCount()).toBe(0)
})

it('rejects missing Accounts without coercing its type', () => {
  const { source } = fixture()
  expect(() => resolveSessionReuse(source, null)).toThrow(/unavailable/)
})

it('rejects credential-bearing synchronous exceptions and result getters safely', async () => {
  for (const failure of ['throw', 'getter']) {
    const { source, accounts, owned, apply } = fixture()
    apply.mockImplementation((_name, _args, options) => {
      if (failure === 'throw') throw new Error('private-token')
      options.onResultReceived(undefined, {
        get id() {
          throw new Error('private-token')
        },
      })
    })
    await expect(
      resolveSessionReuse(source, accounts).authenticate(owned),
    ).rejects.toThrow('Session reuse authentication failed')
  }
})

it('rejects source switching while an internal login is in flight', async () => {
  const { source, accounts, owned, apply } = fixture()
  apply.mockImplementation((_name, _args, options) => {
    source.connection.userId = () => 'other'
    options.onResultReceived(undefined, {
      id: 'account-a',
      token: 'private-token',
    })
  })
  await expect(
    resolveSessionReuse(source, accounts).authenticate(owned),
  ).rejects.toThrow(/authentication failed/)
})

it('requires a distinct owned descriptor and supported source endpoint', async () => {
  const { source, accounts, owned } = fixture()
  const capability = resolveSessionReuse(source, accounts)
  await expect(
    capability.authenticate({ ...owned, ownership: undefined }),
  ).rejects.toThrow(/authentication failed/)
  source.connection._stream.rawUrl = 'https://user:private-token@fixture.test'
  expect(() => resolveSessionReuse(source, accounts)).toThrow(/unavailable/)
})

it('aborts authentication without retaining its timer or replaying late callbacks', async () => {
  vi.useFakeTimers()
  const { source, accounts, owned, apply } = fixture()
  let callback: Callback | undefined
  apply.mockImplementation((_name, _args, options) => {
    callback = options.onResultReceived
  })
  const capability = resolveSessionReuse(source, accounts),
    controller = new AbortController()
  const pending = capability.authenticate(owned, controller.signal)
  controller.abort()
  await expect(pending).rejects.toThrow('stopped')
  expect(vi.getTimerCount()).toBe(0)
  callback?.(undefined, { id: 'account-a', token: 'private-late-token' })
  capability.dispose()
  expect(capability.isCurrent()).toBe(false)
  await expect(capability.authenticate(owned)).rejects.toThrow('changed')
  expect(apply).toHaveBeenCalledOnce()
})
it('rejects pre-aborted authentication without calling Meteor', async () => {
  const { source, accounts, owned, apply } = fixture(),
    controller = new AbortController()
  controller.abort()
  await expect(
    resolveSessionReuse(source, accounts).authenticate(
      owned,
      controller.signal,
    ),
  ).rejects.toThrow()
  expect(apply).not.toHaveBeenCalled()
})

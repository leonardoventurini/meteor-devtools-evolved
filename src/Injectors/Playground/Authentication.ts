import type { ConnectionDescriptor } from '../ConnectionRegistry'
import { PLAYGROUND_LIMITS } from '../../Playground/Limits'

interface SourceConnection {
  userId(): string | null
  status(): { connected: boolean }
  _stream: { rawUrl?: unknown }
}
type ResultCallback = (error?: unknown, result?: unknown) => void
interface AuthenticationConnection {
  _stream: { rawUrl?: unknown }
  status(): { connected: boolean }
  apply(
    name: string,
    args: unknown[],
    options: { noRetry: true; onResultReceived: ResultCallback },
    callback: ResultCallback,
  ): unknown
}
interface AccountsAccess {
  connection: unknown
  _useHttpOnlyCookies?: unknown
  _lastLoginTokenWhenPolled?: unknown
  loggingIn(): unknown
  _storedLoginToken(): unknown
  _storedUserId(): unknown
}
interface Options {
  timeoutMs?: number
  endpointResolver?: (connection: {
    _stream: { rawUrl?: unknown }
  }) => string | undefined
}

const REUSE_UNAVAILABLE =
  'Session reuse unavailable for the selected connection'
const AUTHENTICATION_FAILED = 'Session reuse authentication failed'
const noop = () => {}

const isAccounts = (candidate: unknown): candidate is AccountsAccess => {
  if (!candidate || typeof candidate !== 'object') return false
  return ['loggingIn', '_storedLoginToken', '_storedUserId'].every(
    key => typeof Reflect.get(candidate, key) === 'function',
  )
}

const resolveEndpoint = (connection: {
  _stream: { rawUrl?: unknown }
}): string | undefined => {
  const endpoint = connection._stream.rawUrl
  if (typeof endpoint !== 'string' || endpoint.length === 0) return undefined
  if (endpoint.startsWith('/') && !endpoint.startsWith('//')) return endpoint
  try {
    const url = new URL(endpoint)
    if (
      !['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return undefined
    return endpoint
  } catch {
    return undefined
  }
}

/**
 * Captures a proven source credential only inside page-memory closures. No raw
 * token or server diagnostic crosses this adapter's result/error boundary.
 * Callers must explicitly choose reuse, own the target transport, and dispose it
 * on timeout or source changes. No login is retried and no logout is performed.
 */
export const resolveSessionReuse = (
  source: ConnectionDescriptor<SourceConnection>,
  accountsCandidate: unknown,
  {
    timeoutMs = PLAYGROUND_LIMITS.waitMs,
    endpointResolver = resolveEndpoint,
  }: Options = {},
) => {
  let accounts: AccountsAccess
  let userId: string
  let token: string
  let endpoint: string
  let disposed = false
  try {
    if (source.ownership || !isAccounts(accountsCandidate))
      throw new Error(REUSE_UNAVAILABLE)
    accounts = accountsCandidate
    const observedUserId = source.connection.userId()
    const observedToken = accounts._storedLoginToken()
    const observedEndpoint = endpointResolver(source.connection)
    if (
      accounts.connection !== source.connection ||
      accounts._useHttpOnlyCookies ||
      accounts.loggingIn() ||
      !source.connection.status().connected ||
      typeof observedUserId !== 'string' ||
      !observedUserId ||
      accounts._storedUserId() !== observedUserId ||
      typeof observedToken !== 'string' ||
      !observedToken ||
      accounts._lastLoginTokenWhenPolled !== observedToken ||
      !observedEndpoint ||
      !Number.isInteger(timeoutMs) ||
      timeoutMs <= 0 ||
      timeoutMs > PLAYGROUND_LIMITS.maxWaitMs
    ) {
      throw new Error(REUSE_UNAVAILABLE)
    }
    userId = observedUserId
    token = observedToken
    endpoint = observedEndpoint
  } catch {
    throw new Error(REUSE_UNAVAILABLE)
  }

  const isCurrent = (): boolean => {
    try {
      return (
        !disposed &&
        accounts.connection === source.connection &&
        !accounts._useHttpOnlyCookies &&
        !accounts.loggingIn() &&
        source.connection.status().connected &&
        source.connection.userId() === userId &&
        accounts._storedUserId() === userId &&
        accounts._storedLoginToken() === token &&
        accounts._lastLoginTokenWhenPolled === token &&
        endpointResolver(source.connection) === endpoint
      )
    } catch {
      return false
    }
  }

  const authenticate = async (
    owned: ConnectionDescriptor<AuthenticationConnection>,
    signal?: AbortSignal,
  ): Promise<{ userId: string }> => {
    if (signal?.aborted || !isCurrent())
      throw new Error('Session reuse source context changed')
    try {
      if (
        !owned.ownership ||
        owned.ownership.parentConnectionId !== source.id ||
        Object.is(owned.connection, source.connection) ||
        endpointResolver(owned.connection) !== endpoint ||
        !owned.connection.status().connected
      )
        throw new Error(AUTHENTICATION_FAILED)
    } catch {
      throw new Error(AUTHENTICATION_FAILED)
    }
    return new Promise((resolve, reject) => {
      let settled = false
      const abort = () => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        signal?.removeEventListener('abort', abort)
        reject(new Error('Session reuse authentication stopped'))
      }
      const timeout = setTimeout(() => {
        settled = true
        signal?.removeEventListener('abort', abort)
        reject(new Error('Session reuse authentication timed out'))
      }, timeoutMs)
      signal?.addEventListener('abort', abort, { once: true })
      const onResultReceived: ResultCallback = (error, result) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        signal?.removeEventListener('abort', abort)
        try {
          if (
            error ||
            !isCurrent() ||
            !result ||
            typeof result !== 'object' ||
            Reflect.get(result, 'id') !== userId
          ) {
            reject(new Error(AUTHENTICATION_FAILED))
          } else resolve({ userId })
        } catch {
          reject(new Error(AUTHENTICATION_FAILED))
        }
      }
      try {
        const result = owned.connection.apply(
          'login',
          [{ resume: token }],
          { noRetry: true, onResultReceived },
          noop,
        )
        // Some compatible implementations return a promise as well as callbacks.
        // Consume rejection without ever forwarding credential-bearing errors.
        if (result instanceof Promise)
          void result.catch(() => onResultReceived(true))
      } catch {
        onResultReceived(true)
      }
    })
  }

  return {
    userId,
    isCurrent,
    authenticate,
    dispose: () => {
      disposed = true
      token = ''
    },
  }
}

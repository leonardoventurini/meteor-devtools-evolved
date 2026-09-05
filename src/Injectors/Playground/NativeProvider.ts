import type {
  ConnectionDescriptor,
  ConnectionRegistry,
} from '../ConnectionRegistry'
import type { RunCommand } from '../../Playground/Commands'
import { PublicationDocuments } from '../../Playground/Documents'
import { PLAYGROUND_LIMITS } from '../../Playground/Limits'
import type { AuthenticationObservation } from '../../Playground/RunRecord'
import { resolveSessionReuse } from './Authentication'
import type { ExecutionTarget } from './Runner'
import { createOwnedConnection } from './OwnedConnection'
import { assertNoRetryCapability } from './NoRetryCapability'
import { observeStream } from './StreamObserver'

type NativeConnection = ExecutionTarget['connection'] & {
  _stream: ExecutionTarget['connection']['_stream'] & {
    _online(): void
    rawUrl?: unknown
    options?: unknown
  }
  disconnect(options: { _permanent: true }): unknown
  userId?(): unknown
}
interface ProviderOptions<TConnection extends object> {
  registry: ConnectionRegistry<TConnection>
  connect(endpoint: string, options: { retry: false }): TConnection
  accounts(): unknown
  eventTarget?: EventTarget
  pageUrl?: string
  now?: () => number
}
const POLL_MS = 50
const noop = () => {}
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object'
const native = (value: unknown): value is NativeConnection => {
  if (
    !object(value) ||
    !object(value._stream) ||
    !object(value._methodInvokers) ||
    !object(value._subscriptions)
  )
    return false
  const stream = value._stream
  return (
    ['apply', 'subscribe', 'status', 'disconnect'].every(
      key => typeof value[key] === 'function',
    ) &&
    ['send', 'on', '_online'].every(key => typeof stream[key] === 'function') &&
    object(stream.eventCallbacks)
  )
}
const identityConnection = (
  connection: NativeConnection,
): connection is NativeConnection & { userId(): string | null } => {
  try {
    if (typeof connection.userId !== 'function') return false
    const value = connection.userId()
    return value === null || typeof value === 'string'
  } catch {
    return false
  }
}
const endpoint = (connection: NativeConnection): string | undefined => {
  const raw = connection._stream.rawUrl
  if (typeof raw !== 'string' || raw.length === 0) return undefined
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw
  try {
    const url = new URL(raw)
    if (
      ['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol) &&
      !url.username &&
      !url.password
    )
      return raw
  } catch {
    /* Unsupported endpoints cannot become owned targets. */
  }
  return undefined
}
const transportOptionsSupported = (connection: NativeConnection): boolean => {
  const options = connection._stream.options
  if (!object(options)) return false
  const keys = new Set([
    'retry',
    'ConnectionError',
    'headers',
    '_sockjsOptions',
    '_dontPrintErrors',
    'connectTimeoutMs',
    'npmFayeOptions',
  ])
  for (const [key, value] of Object.entries(options)) {
    if (!keys.has(key)) return false
    if (value === undefined) continue
    if (key === 'retry' && typeof value === 'boolean') continue
    if (key === 'ConnectionError' && typeof value === 'function') continue
    if (key === '_dontPrintErrors' && typeof value === 'boolean') continue
    if (
      ['headers', '_sockjsOptions', 'npmFayeOptions'].includes(key) &&
      object(value) &&
      Object.keys(value).length === 0
    )
      continue
    return false
  }
  return true
}
const loggingIn = (candidate: Record<string, unknown>): boolean | undefined =>
  typeof candidate.loggingIn === 'function'
    ? Reflect.apply(candidate.loggingIn, candidate, []) === true
    : undefined
/**
 * Bridges a broad registry into native capabilities one descriptor at a time.
 * Authentication is observed only on the exact Accounts-bound connection;
 * endpoint equality never confers session identity on secondary connections.
 */
export const createNativeProvider = <TConnection extends object>({
  registry,
  connect,
  accounts,
  eventTarget = globalThis,
  pageUrl,
  now = Date.now,
}: ProviderOptions<TConnection>) => {
  const endpointLabel = (raw: string): string => {
    if (!pageUrl || !raw.startsWith('/')) return raw
    try {
      const url = new URL(raw, pageUrl)
      url.username = ''
      url.password = ''
      return url.href
    } catch {
      return raw
    }
  }
  const sources = new WeakMap<
    ExecutionTarget,
    ConnectionDescriptor<NativeConnection>
  >()
  const narrow = (
    descriptor: ConnectionDescriptor<TConnection>,
  ): ConnectionDescriptor<NativeConnection> | undefined =>
    native(descriptor.connection)
      ? { ...descriptor, connection: descriptor.connection }
      : undefined
  const constructed = new WeakMap<NativeConnection, TConnection>()
  const ownedRegistry: Parameters<
    typeof createOwnedConnection<NativeConnection>
  >[0] = {
    list: () =>
      registry.list().flatMap(item => {
        const value = narrow(item)
        return value ? [value] : []
      }),
    listOwned: () =>
      registry.listOwned().flatMap(item => {
        const value = narrow(item)
        return value ? [value] : []
      }),
    getConstructionOwnership: registry.getConstructionOwnership,
    disposeOwned: registry.disposeOwned,
    createOwned: (ownership, factory) => {
      let result: NativeConnection | undefined
      const descriptor = registry.createOwned(ownership, () => {
        const candidate = factory()
        result = candidate
        const pending = constructed.get(candidate)
        if (!pending || !Object.is(pending, candidate))
          throw new Error('Owned connection factory mismatch.')
        return pending
      })
      if (!result) throw new Error('Owned connection construction failed.')
      return { ...descriptor, connection: result }
    },
  }
  const resolveTarget = (connectionId: string): ExecutionTarget | undefined => {
    const raw = registry.get(connectionId)
    if (!raw || raw.ownership) return undefined
    const descriptor = narrow(raw)
    if (!descriptor) return undefined
    const connection = descriptor.connection,
      selectedEndpoint = endpoint(connection)
    let bound = false,
      observedLogin: boolean | undefined,
      observedId: string | null | undefined
    try {
      const candidate = accounts()
      bound =
        object(candidate) &&
        candidate.connection === connection &&
        identityConnection(connection)
      if (bound && object(candidate)) {
        observedLogin = loggingIn(candidate)
        const id = connection.userId?.()
        if (typeof id === 'string') observedId = id
        else if (id === null) observedId = null
        else bound = false
      }
    } catch {
      bound = false
    }
    let state: AuthenticationObservation['state'] = 'unknown'
    if (bound && observedLogin === false)
      state = observedId === null ? 'anonymous' : 'authenticated'
    const authentication: AuthenticationObservation = {
      state,
      ...(state === 'authenticated' && typeof observedId === 'string'
        ? { userId: observedId }
        : {}),
      observedAt: now(),
      provenance: bound
        ? 'Selected connection is bound to this Accounts instance.'
        : 'Authentication is not exposed for this selected connection.',
    }
    const target: ExecutionTarget = {
      connection,
      endpointLabel: selectedEndpoint
        ? endpointLabel(selectedEndpoint)
        : descriptor.displayName,
      authentication,
      sourceCurrent: () => {
        try {
          if (
            registry.get(connectionId)?.connection !== raw.connection ||
            !connection.status().connected ||
            endpoint(connection) !== selectedEndpoint
          )
            return false
          if (!bound) return true
          const candidate = accounts()
          return (
            object(candidate) &&
            candidate.connection === connection &&
            connection.userId?.() === observedId &&
            loggingIn(candidate) === observedLogin
          )
        } catch {
          return false
        }
      },
    }
    sources.set(target, descriptor)
    return target
  }
  const openIsolated = async (
    source: ExecutionTarget,
    command: RunCommand,
    signal: AbortSignal,
  ): Promise<ExecutionTarget> => {
    const descriptor = sources.get(source),
      selectedEndpoint = descriptor
        ? endpoint(descriptor.connection)
        : undefined
    if (
      signal.aborted ||
      !descriptor ||
      !selectedEndpoint ||
      source.sourceCurrent?.() === false ||
      command.mode !== 'isolated' ||
      command.connectionId !== descriptor.id
    )
      throw new Error('Selected source context is unavailable for isolation.')
    if (!transportOptionsSupported(descriptor.connection))
      throw new Error(
        'Custom or unknown transport options cannot be reproduced for isolation.',
      )
    if (
      registry
        .listOwned()
        .filter(
          item => item.ownership?.panelSessionId === command.panelSessionId,
        ).length >= PLAYGROUND_LIMITS.ownedConnections
    )
      throw new Error('Owned connection limit reached.')
    let reuse =
      command.authentication === 'reuse'
        ? (() => {
            if (!identityConnection(descriptor.connection))
              throw new Error(
                'Session reuse unavailable for selected connection.',
              )
            return resolveSessionReuse(
              { ...descriptor, connection: descriptor.connection },
              accounts(),
              { timeoutMs: command.waitMs },
            )
          })()
        : undefined
    const documents = new PublicationDocuments({})
    let release = noop,
      disposed = false
    const owned = createOwnedConnection(
      ownedRegistry,
      {
        parentConnectionId: descriptor.id,
        pageEpoch: command.pageEpoch,
        panelSessionId: command.panelSessionId,
        requestId: command.requestId,
      },
      () => {
        const candidate = connect(selectedEndpoint, { retry: false })
        if (!native(candidate)) {
          const registered = registry
            .listOwned()
            .find(
              item =>
                item.connection === candidate &&
                item.ownership?.requestId === command.requestId,
            )
          if (!registry.list().some(item => item.connection === candidate)) {
            try {
              const disconnect: unknown = Reflect.get(candidate, 'disconnect')
              if (typeof disconnect === 'function')
                Reflect.apply(disconnect, candidate, [{ _permanent: true }])
            } finally {
              if (registered) registry.disposeOwned(registered.id)
            }
          }
          throw new Error('Native owned connection capability unavailable.')
        }
        constructed.set(candidate, candidate)
        return candidate
      },
      eventTarget,
    )
    const dispose = () => {
      if (disposed) return
      disposed = true
      try {
        release()
      } finally {
        reuse?.dispose()
        reuse = undefined
        owned.dispose()
      }
    }
    const current = () => {
      try {
        return (
          !disposed &&
          !signal.aborted &&
          source.sourceCurrent?.() !== false &&
          transportOptionsSupported(descriptor.connection) &&
          (reuse?.isCurrent() ?? true)
        )
      } catch {
        return false
      }
    }

    try {
      if (
        endpoint(owned.descriptor.connection) !== selectedEndpoint ||
        !object(owned.descriptor.connection._stream.options) ||
        owned.descriptor.connection._stream.options.retry !== false
      )
        throw new Error(
          'Owned transport did not preserve selected endpoint and retry policy.',
        )
      release = observeStream(owned.descriptor.connection._stream, {
        outbound: () => {},
        inbound: raw => documents.observe(raw),
        disconnect: () =>
          documents.incomplete(
            'Owned connection disconnected before dispatch.',
          ),
      })
      await new Promise<void>((resolve, reject) => {
        const finish = (error?: Error) => {
          clearInterval(timer)
          clearTimeout(timeout)
          signal.removeEventListener('abort', aborted)
          if (error) reject(error)
          else resolve()
        }
        const check = () => {
          try {
            if (!current())
              finish(new Error('Owned connection source changed.'))
            else if (owned.descriptor.connection.status().connected) finish()
          } catch {
            finish(new Error('Owned connection status capability unavailable.'))
          }
        }
        const aborted = () =>
          finish(new Error('Owned connection setup stopped.'))
        const timer = setInterval(check, POLL_MS),
          timeout = setTimeout(
            () => finish(new Error('Owned connection setup timed out.')),
            command.waitMs,
          )
        signal.addEventListener('abort', aborted, { once: true })
        check()
      })
      let authentication: AuthenticationObservation = {
        state: 'anonymous',
        observedAt: now(),
        provenance:
          'Fresh isolated connection; no authentication request was sent.',
      }
      if (reuse) {
        assertNoRetryCapability(owned.descriptor.connection)
        const authenticationAbort = new AbortController()
        const abort = () => authenticationAbort.abort()
        signal.addEventListener('abort', abort, { once: true })
        const authenticationPoll = setInterval(() => {
          if (!current()) abort()
        }, POLL_MS)
        let result: { userId: string }
        try {
          result = await reuse.authenticate(
            owned.descriptor,
            authenticationAbort.signal,
          )
        } finally {
          clearInterval(authenticationPoll)
          signal.removeEventListener('abort', abort)
        }
        authentication = {
          state: 'authenticated',
          userId: result.userId,
          observedAt: now(),
          provenance:
            'Selected session reuse authenticated on this owned connection.',
        }
      }
      if (!current()) throw new Error('Owned source context changed.')
      const evidence = documents.snapshot('pending')
      if (documents.truncated || evidence.documentBaseline !== 'known')
        throw new Error(
          'Owned baseline is incomplete or exceeds capture limits.',
        )
      release()
      release = noop
      return {
        connection: owned.descriptor.connection,
        endpointLabel: endpointLabel(selectedEndpoint),
        authentication,
        baseline: documents.rawDocumentSnapshot(),
        sourceCurrent: () => {
          try {
            return current() && owned.descriptor.connection.status().connected
          } catch {
            return false
          }
        },
        dispose,
      }
    } catch {
      dispose()
      throw new Error('Isolated connection setup or session reuse unavailable.')
    }
  }
  return { resolveTarget, openIsolated }
}

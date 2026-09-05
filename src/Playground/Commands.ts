import { PLAYGROUND_LIMITS, PLAYGROUND_PROTOCOL_VERSION } from './Limits'
import { validateValue, valueBytes, type EncodedValue } from './Values'

export type OperationKind = 'method' | 'subscription'

export interface Operation {
  kind: OperationKind
  name: string
  parameters: EncodedValue[]
}

export type ExecutionContext =
  | { mode: 'application'; authentication: 'current' }
  | { mode: 'isolated'; authentication: 'anonymous' | 'reuse' }

export interface SessionIdentity {
  version: typeof PLAYGROUND_PROTOCOL_VERSION
  panelSessionId: string
  pageEpoch: string
}

export type RunCommand = SessionIdentity &
  ExecutionContext & {
    kind: 'run'
    requestId: string
    connectionId: string
    operation: Operation
    sessionLabel: string
    waitMs: number
  }

export type PlaygroundCommand =
  | RunCommand
  | (SessionIdentity & { kind: 'open' | 'renew' | 'close' | 'stop-all' })
  | (SessionIdentity & { kind: 'stop'; requestId: string })

const SESSION_KEYS = ['version', 'kind', 'panelSessionId', 'pageEpoch'] as const
const RUN_KEYS = [
  ...SESSION_KEYS,
  'requestId',
  'connectionId',
  'operation',
  'mode',
  'authentication',
  'sessionLabel',
  'waitMs',
] as const

const record = (value: EncodedValue): Record<string, EncodedValue> => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Expected an object in the playground command.')
  }
  return value
}

const allowKeys = (
  value: Record<string, EncodedValue>,
  keys: readonly string[],
) => {
  if (Object.keys(value).some(key => !keys.includes(key))) {
    throw new TypeError('Unknown playground command field.')
  }
}

const text = (
  value: EncodedValue | undefined,
  name: string,
  max = 128,
): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new TypeError(`Invalid ${name}.`)
  }
  return value
}

/**
 * Runtime validation precedes routing. Unknown fields are rejected, including
 * URL overrides; imported or page-supplied commands cannot select arbitrary
 * endpoints. Encoded argument objects retain their own application data fields.
 */
export const parseCommand = (input: unknown): PlaygroundCommand => {
  validateValue(input)
  if (valueBytes(input) > PLAYGROUND_LIMITS.requestBytes) {
    throw new TypeError('Playground command exceeds the 256 KiB request limit.')
  }
  const value = record(input)
  if (value.version !== PLAYGROUND_PROTOCOL_VERSION) {
    throw new TypeError('Unsupported playground protocol version.')
  }
  const identity: SessionIdentity = {
    version: PLAYGROUND_PROTOCOL_VERSION,
    panelSessionId: text(value.panelSessionId, 'panel session'),
    pageEpoch: text(value.pageEpoch, 'page epoch'),
  }

  switch (value.kind) {
    case 'open':
    case 'renew':
    case 'close':
    case 'stop-all': {
      allowKeys(value, SESSION_KEYS)
      return { ...identity, kind: value.kind }
    }
  }
  if (value.kind === 'stop') {
    allowKeys(value, [...SESSION_KEYS, 'requestId'])
    return {
      ...identity,
      kind: 'stop',
      requestId: text(value.requestId, 'request ID'),
    }
  }
  if (value.kind !== 'run')
    throw new TypeError('Unknown playground command kind.')
  allowKeys(value, RUN_KEYS)

  const operation = record(value.operation ?? null)
  allowKeys(operation, ['kind', 'name', 'parameters'])
  if (operation.kind !== 'method' && operation.kind !== 'subscription') {
    throw new TypeError('Unknown playground operation kind.')
  }
  if (!Array.isArray(operation.parameters)) {
    throw new TypeError('Operation parameters must be an encoded EJSON array.')
  }
  let context: ExecutionContext
  if (value.mode === 'application' && value.authentication === 'current') {
    context = { mode: 'application', authentication: 'current' }
  } else if (
    value.mode === 'isolated' &&
    (value.authentication === 'anonymous' || value.authentication === 'reuse')
  ) {
    context = { mode: 'isolated', authentication: value.authentication }
  } else {
    throw new TypeError('Authentication does not match the execution mode.')
  }
  if (
    typeof value.waitMs !== 'number' ||
    !Number.isInteger(value.waitMs) ||
    value.waitMs < PLAYGROUND_LIMITS.minWaitMs ||
    value.waitMs > PLAYGROUND_LIMITS.maxWaitMs
  ) {
    throw new TypeError('Wait must be between 1 and 60 seconds.')
  }

  return {
    ...identity,
    ...context,
    kind: 'run',
    requestId: text(value.requestId, 'request ID'),
    connectionId: text(value.connectionId, 'connection ID'),
    operation: {
      kind: operation.kind,
      name: text(operation.name, 'operation name', 256),
      parameters: operation.parameters,
    },
    sessionLabel: text(value.sessionLabel, 'session label', 120),
    waitMs: value.waitMs,
  }
}

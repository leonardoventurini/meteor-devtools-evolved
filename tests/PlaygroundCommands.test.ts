import { describe, expect, it } from 'vitest'
import { parseCommand, type RunCommand } from '../src/Playground/Commands'
import { SessionLedger } from '../src/Playground/SessionLedger'
import { PLAYGROUND_LIMITS } from '../src/Playground/Limits'

const run = (requestId = 'request-1'): RunCommand => ({
  version: 1,
  kind: 'run',
  panelSessionId: 'panel-1',
  pageEpoch: 'page-1',
  requestId,
  connectionId: 'default',
  operation: { kind: 'method', name: 'fixture.echo', parameters: [1] },
  mode: 'application',
  authentication: 'current',
  sessionLabel: 'Account A',
  waitMs: PLAYGROUND_LIMITS.waitMs,
})

describe('playground command validation', () => {
  it('accepts and narrows validated operation and lifecycle commands', () => {
    expect(parseCommand(run())).toEqual(run())
    expect(
      parseCommand({
        version: 1,
        kind: 'open',
        panelSessionId: 'p',
        pageEpoch: 'e',
      }).kind,
    ).toBe('open')
  })

  it.each([
    { version: 2 },
    { pageEpoch: '' },
    { connectionId: '' },
    { requestId: '' },
    { endpoint: 'https://other.example' },
    { waitMs: 0 },
    { waitMs: 60_001 },
    { mode: 'isolated', authentication: 'current' },
    { mode: 'application', authentication: 'reuse' },
    { operation: { kind: 'method', name: 'echo', parameters: {} } },
    { operation: { kind: 'script', name: 'echo', parameters: [] } },
  ])('rejects invalid or privileged input %j', change => {
    expect(() => parseCommand({ ...run(), ...change })).toThrow()
  })

  it('limits the full command, not just its parameter array', () => {
    expect(() =>
      parseCommand({
        ...run(),
        operation: {
          ...run().operation,
          parameters: ['x'.repeat(PLAYGROUND_LIMITS.requestBytes)],
        },
      }),
    ).toThrow('request limit')
  })
})

describe('playground session ledger', () => {
  it('requires a handshake and rejects stale page and retired panel identities', () => {
    const ledger = new SessionLedger('page-1', () => 0)
    expect(() => ledger.accept(run())).toThrow('active')
    ledger.open('panel-1', 'page-1')
    expect(ledger.accept(run())).toBe('new')
    expect(ledger.accept(run())).toBe('duplicate')
    ledger.open('panel-2', 'page-1')
    expect(() => ledger.accept(run('late'))).toThrow('active')
    expect(() => ledger.open('panel-1', 'page-1')).toThrow('retired')
    expect(() => ledger.open('panel-3', 'page-other')).toThrow('page')
  })

  it('expires before dispatch, cannot renew after expiry, and retires on close', () => {
    let now = 0
    const ledger = new SessionLedger('page-1', () => now)
    ledger.open('panel-1', 'page-1')
    now = PLAYGROUND_LIMITS.leaseDurationMs - 1
    ledger.renew('panel-1', 'page-1')
    now += PLAYGROUND_LIMITS.leaseDurationMs
    expect(() => ledger.accept(run())).toThrow('expired')
    expect(() => ledger.renew('panel-1', 'page-1')).toThrow('active')
    ledger.open('panel-2', 'page-1')
    ledger.close('panel-2', 'page-1')
    expect(() => ledger.open('panel-2', 'page-1')).toThrow('retired')
  })

  it('rejects new commands at capacity without evicting duplicate protection', () => {
    const ledger = new SessionLedger('page-1', () => 0)
    ledger.open('panel-1', 'page-1')
    for (let index = 0; index < PLAYGROUND_LIMITS.requestLedger; index++) {
      expect(ledger.accept(run(`request-${index}`))).toBe('new')
    }
    expect(ledger.accept(run('request-0'))).toBe('duplicate')
    expect(() => ledger.accept(run('overflow'))).toThrow('limit')
  })

  it('announces retirement exactly once so owners can release resources', () => {
    let now = 0
    const retired: string[] = []
    const ledger = new SessionLedger(
      'page-1',
      () => now,
      id => retired.push(id),
    )
    ledger.open('panel-1', 'page-1')
    ledger.open('panel-1', 'page-1')
    expect(retired).toEqual([])
    now = PLAYGROUND_LIMITS.leaseDurationMs
    ledger.expire()
    ledger.expire()
    expect(retired).toEqual(['panel-1'])
  })
})

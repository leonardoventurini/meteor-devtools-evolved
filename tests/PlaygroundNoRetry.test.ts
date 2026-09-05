/* eslint-disable unicorn/no-this-outside-of-class -- Exercise native allocator receiver isolation. */
import { describe, expect, it, vi } from 'vitest'
import { assertNoRetryCapability } from '../src/Injectors/Playground/NoRetryCapability'

describe('native no-retry preflight', () => {
  it('exercises allocation on a detached receiver without target state or network', () => {
    const send = vi.fn()
    const source = {
      _nextMethodId: 42,
      _send: send,
      _methodInvokers: { live: { noRetry: false } },
      _apply(
        this: {
          _nextMethodId: number
          _methodInvokers: Record<string, unknown>
          _send: (value: unknown) => void
        },
        _name: unknown,
        _stub: unknown,
        _args: unknown,
        options: { noRetry: boolean; onResultReceived: unknown },
      ) {
        const id = String(this._nextMethodId++)
        this._methodInvokers[id] = {
          noRetry: options.noRetry,
          _onResultReceived: options.onResultReceived,
        }
        this._send({ id })
      },
    }
    expect(() => assertNoRetryCapability(source)).not.toThrow()
    expect(source._nextMethodId).toBe(42)
    expect(Object.keys(source._methodInvokers)).toEqual(['live'])
    expect(send).not.toHaveBeenCalled()
  })

  it('rejects implementations that ignore the option or cannot be probed', () => {
    for (const source of [
      {},
      { _apply() {} },
      {
        _apply() {
          throw new Error('secret detail')
        },
      },
      {
        _apply(this: { _methodInvokers: Record<string, unknown> }) {
          this._methodInvokers['1'] = { noRetry: false }
        },
      },
    ]) {
      expect(() => assertNoRetryCapability(source)).toThrow(
        'No-retry capability unavailable',
      )
      expect(() => assertNoRetryCapability(source)).not.toThrow('secret detail')
    }
  })
})

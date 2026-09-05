import { describe, expect, it } from 'vitest'
import { createMethodRun, reduceMethodRun } from '../src/Playground/MethodRun'

describe('method run evidence lifecycle', () => {
  it('records an in-flight async invocation sending after local stop without reopening', () => {
    let run = reduceMethodRun(createMethodRun(0), { kind: 'invoke', at: 1 })
    run = reduceMethodRun(run, { kind: 'stop', at: 2 })
    run = reduceMethodRun(run, { kind: 'dispatch', at: 3, methodId: 'async-1' })
    run = reduceMethodRun(run, { kind: 'result', at: 4, result: true })
    expect(run).toMatchObject({
      phase: 'stopped',
      invokedAt: 1,
      dispatchedAt: 3,
      endedAt: 2,
      lateEvidence: true,
      outcome: 'success',
    })
  })
  it.each([true, false])(
    'settles independent signals when result first is %s',
    resultFirst => {
      let run = createMethodRun(100)
      run = reduceMethodRun(run, { kind: 'dispatch', at: 101, methodId: 'm1' })
      const signals = [
        { kind: 'result' as const, at: 110, result: { $date: 123 } },
        { kind: 'updated' as const, at: 120 },
      ]
      if (!resultFirst) signals.reverse()
      run = reduceMethodRun(run, signals[0]!)
      expect(run.phase).toBe('running')
      run = reduceMethodRun(run, signals[1]!)
      expect(run).toMatchObject({
        phase: 'settled',
        resultSeen: true,
        writesReflected: true,
        outcome: 'success',
      })
      expect(run.result).toEqual({ $date: 123 })
      expect(run.serverElapsedMs).toBe(9)
    },
  )

  it('preserves late results without reopening timed-out or stopped execution', () => {
    for (const kind of ['timeout', 'stop', 'disconnect'] as const) {
      let run = createMethodRun(0)
      run = reduceMethodRun(run, { kind: 'dispatch', at: 1, methodId: '1' })
      run = reduceMethodRun(run, { kind, at: 10 })
      const phase = run.phase
      run = reduceMethodRun(run, { kind: 'result', at: 12, result: 1 })
      run = reduceMethodRun(run, { kind: 'updated', at: 13 })
      expect(run.phase).toBe(phase)
      expect(run).toMatchObject({
        lateEvidence: true,
        outcome: 'success',
        writesReflected: true,
      })
    }
  })

  it('distinguishes local failure, unknown execution, and known server errors', () => {
    const initial = createMethodRun(0)
    expect(
      reduceMethodRun(initial, {
        kind: 'local-error',
        at: 1,
        message: 'Unsupported',
      }),
    ).toMatchObject({
      phase: 'local-error',
      outcome: 'unknown',
      resultSeen: false,
    })
    const sent = reduceMethodRun(initial, {
      kind: 'dispatch',
      at: 1,
      methodId: '1',
    })
    const error = reduceMethodRun(sent, {
      kind: 'result',
      at: 2,
      error: { error: 'forbidden' },
    })
    expect(error).toMatchObject({
      phase: 'settled',
      outcome: 'error',
      writesReflected: false,
    })
    expect(reduceMethodRun(error, { kind: 'timeout', at: 10 })).toEqual(error)
  })

  it('ignores duplicate result and writes markers and never accepts a second dispatch', () => {
    let run = reduceMethodRun(createMethodRun(0), {
      kind: 'dispatch',
      at: 1,
      methodId: '1',
    })
    expect(() =>
      reduceMethodRun(run, { kind: 'dispatch', at: 2, methodId: '2' }),
    ).toThrow('dispatch')
    run = reduceMethodRun(run, { kind: 'result', at: 3, result: null })
    expect(
      reduceMethodRun(run, { kind: 'result', at: 4, result: 'changed' }),
    ).toEqual(run)
    run = reduceMethodRun(run, { kind: 'updated', at: 5 })
    expect(reduceMethodRun(run, { kind: 'updated', at: 6 })).toEqual(run)
  })

  it('marks no-value success separately from an explicit null result', () => {
    const sent = reduceMethodRun(createMethodRun(0), {
      kind: 'dispatch',
      at: 1,
      methodId: '1',
    })
    const empty = reduceMethodRun(sent, { kind: 'result', at: 2 })
    const nullable = reduceMethodRun(sent, {
      kind: 'result',
      at: 2,
      result: null,
    })
    expect(empty.outcome).toBe('success')
    expect(empty.resultSeen).toBe(true)
    expect(Object.hasOwn(empty, 'result')).toBe(false)
    expect(Object.hasOwn(nullable, 'result')).toBe(true)
  })

  it('rejects results before a recorded dispatch and preserves input objects', () => {
    const initial = createMethodRun(0)
    expect(() =>
      reduceMethodRun(initial, { kind: 'result', at: 1, result: true }),
    ).toThrow('dispatch')
    const next = reduceMethodRun(initial, {
      kind: 'dispatch',
      at: 1,
      methodId: '1',
    })
    expect(initial.phase).toBe('queued')
    expect(next.phase).toBe('running')
  })
})

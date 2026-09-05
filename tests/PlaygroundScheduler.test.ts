import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MatrixScheduler,
  type MatrixOutcome,
} from '../src/Playground/Scheduler'
import { generateMatrix } from '../src/Playground/Matrix'

const variants = () =>
  generateMatrix([0], {
    includeBaseline: true,
    changes: [
      {
        path: '/0',
        candidates: [{ kind: 'null' }, { kind: 'value', value: 2 }],
      },
    ],
  })
const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
}
afterEach(() => vi.useRealTimers())
describe('sequential matrix scheduler', () => {
  it('includes baseline and awaits completion plus the configured delay', async () => {
    vi.useFakeTimers()
    let resolve!: (value: MatrixOutcome) => void
    const execute = vi.fn(() => ({
      result: new Promise<MatrixOutcome>(done => {
        resolve = done
      }),
      stop: vi.fn(),
    }))
    const scheduler = new MatrixScheduler({ execute })
    const result = scheduler.start(variants())
    expect(execute).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(execute).toHaveBeenCalledTimes(1)
    resolve({ status: 'success' })
    await flush()
    await vi.advanceTimersByTimeAsync(249)
    expect(execute).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(execute).toHaveBeenCalledTimes(2)
    resolve({ status: 'success' })
    await flush()
    await vi.advanceTimersByTimeAsync(250)
    resolve({ status: 'success' })
    const summary = await result
    expect(summary.reason).toBe('completed')
  })
  it.each(['error', 'assertion-failed'] as const)(
    'allows explicit continuation after %s only',
    async status => {
      vi.useFakeTimers()
      const execute = vi.fn(() => ({
        result: Promise.resolve({ status }),
        stop: vi.fn(),
      }))
      const scheduler = new MatrixScheduler({ execute })
      const first = await scheduler.start(variants())
      expect(first.started).toBe(1)
      const result = scheduler.start(variants(), { continueOnError: true })
      await vi.runAllTimersAsync()
      const summary = await result
      expect(summary.started).toBe(3)
    },
  )
  it.each([
    'timeout',
    'interrupted',
    'limit-exceeded',
    'inconclusive',
    'stopped',
  ] as const)('always stops on %s', async status => {
    const scheduler = new MatrixScheduler({
      execute: () => ({ result: Promise.resolve({ status }), stop() {} }),
    })
    const summary = await scheduler.start(variants(), { continueOnError: true })
    expect(summary.started).toBe(1)
  })
  it('stops waiting immediately and never dispatches after late settlement', async () => {
    vi.useFakeTimers()
    let resolve!: (value: MatrixOutcome) => void
    const stop = vi.fn()
    const execute = vi.fn(() => ({
      result: new Promise<MatrixOutcome>(done => {
        resolve = done
      }),
      stop,
    }))
    const scheduler = new MatrixScheduler({ execute })
    const result = scheduler.start(variants())
    scheduler.stop()
    const summary = await result
    expect(summary.reason).toBe('stopped')
    expect(stop).toHaveBeenCalledOnce()
    resolve({ status: 'success' })
    await vi.runAllTimersAsync()
    expect(execute).toHaveBeenCalledOnce()
  })
  it('enforces total elapsed budget even if a runner never settles', async () => {
    vi.useFakeTimers()
    const stop = vi.fn()
    const scheduler = new MatrixScheduler({
      execute: () => ({ result: new Promise<MatrixOutcome>(() => {}), stop }),
    })
    const result = scheduler.start(variants())
    await vi.advanceTimersByTimeAsync(120_000)
    const summary = await result
    expect(summary.reason).toBe('timeout')
    expect(stop).toHaveBeenCalledOnce()
  })
  it('revalidates context before every dispatch', async () => {
    vi.useFakeTimers()
    let valid = true
    const execute = vi.fn(() => ({
      result: Promise.resolve({ status: 'success' as const }),
      stop() {},
    }))
    const scheduler = new MatrixScheduler({
      execute,
      contextValid: () => valid,
    })
    const result = scheduler.start(variants())
    await flush()
    valid = false
    await vi.runAllTimersAsync()
    const summary = await result
    expect(summary.reason).toBe('interrupted')
    expect(execute).toHaveBeenCalledOnce()
  })
  it('stops queued work during the delay and emits final progress', async () => {
    vi.useFakeTimers()
    const execute = vi.fn(() => ({
      result: Promise.resolve({ status: 'success' as const }),
      stop: vi.fn(),
    }))
    const onProgress = vi.fn()
    const scheduler = new MatrixScheduler({ execute, onProgress })
    const pending = scheduler.start(variants())
    await vi.advanceTimersByTimeAsync(100)
    scheduler.stop('interrupted')
    const summary = await pending
    await vi.runAllTimersAsync()
    expect(summary).toMatchObject({
      started: 1,
      reason: 'interrupted',
      total: 3,
    })
    expect(execute).toHaveBeenCalledOnce()
    expect(onProgress).toHaveBeenLastCalledWith(summary)
    expect(scheduler.running).toBe(false)
  })
  it('interrupts and cleans up when execution rejects without retrying', async () => {
    const stop = vi.fn()
    const execute = vi.fn(() => ({
      result: Promise.reject(new Error('runner failure')),
      stop,
    }))
    const scheduler = new MatrixScheduler({ execute })
    const summary = await scheduler.start(variants(), { continueOnError: true })
    expect(summary.reason).toBe('interrupted')
    expect(execute).toHaveBeenCalledOnce()
    expect(stop).toHaveBeenCalledOnce()
  })
  it('copies the reviewed plan so later edits cannot change queued requests', async () => {
    vi.useFakeTimers()
    const plan = variants()
    const execute = vi.fn(() => ({
      result: Promise.resolve({ status: 'success' as const }),
      stop() {},
    }))
    const scheduler = new MatrixScheduler({ execute })
    const pending = scheduler.start(plan)
    plan[1]!.parameters = ['changed']
    await vi.runAllTimersAsync()
    await pending
    expect(execute).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ parameters: [null] }),
      1,
    )
  })
  it('validates budgets and prevents overlapping starts', async () => {
    const scheduler = new MatrixScheduler({
      execute: () => ({
        result: new Promise<MatrixOutcome>(() => {}),
        stop() {},
      }),
    })
    await expect(
      scheduler.start(Array.from({ length: 21 }, () => variants()[0]!)),
    ).rejects.toThrow()
    await expect(scheduler.start(variants(), { delayMs: 99 })).rejects.toThrow()
    const pending = scheduler.start(variants())
    await expect(scheduler.start(variants())).rejects.toThrow()
    scheduler.stop()
    await pending
  })
})

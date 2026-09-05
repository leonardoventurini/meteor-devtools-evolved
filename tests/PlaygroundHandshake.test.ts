import { afterEach, expect, it, vi } from 'vitest'
import { startPlaygroundHandshake } from '../src/Playground/PanelHandshake'

afterEach(() => vi.useRealTimers())

it('repeats only passive discovery until the panel session is ready', () => {
  vi.useFakeTimers()
  let ready = false
  const send = vi.fn()
  const stop = startPlaygroundHandshake(send, () => ready)
  expect(send).toHaveBeenCalledOnce()
  vi.advanceTimersByTime(1000)
  expect(send).toHaveBeenCalledTimes(2)
  ready = true
  vi.advanceTimersByTime(1000)
  expect(vi.getTimerCount()).toBe(0)
  stop()
})

it('has a finite discovery budget and explicit disposal', () => {
  vi.useFakeTimers()
  const send = vi.fn()
  startPlaygroundHandshake(send, () => false)
  vi.runAllTimers()
  expect(send).toHaveBeenCalledTimes(20)
  expect(vi.getTimerCount()).toBe(0)
  const stop = startPlaygroundHandshake(send, () => false)
  stop()
  expect(vi.getTimerCount()).toBe(0)
})

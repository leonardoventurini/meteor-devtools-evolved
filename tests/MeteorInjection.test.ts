import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DDPInjector } from '../src/Injectors/DDPInjector'
import { initializeMeteorConnections } from '../src/Injectors/MeteorConnections'
import { MeteorAdapter } from '../src/Injectors/MeteorAdapter'
import { MinimongoInjector } from '../src/Injectors/MinimongoInjector'
import { injectAll } from '../src/Browser/Inject'
import { initializePlayground } from '../src/Injectors/Playground/Bootstrap'

vi.mock('../src/Injectors/Playground/Bootstrap', () => ({
  initializePlayground: vi.fn(),
}))

vi.mock('../src/Injectors/DDPInjector', () => ({ DDPInjector: vi.fn() }))
vi.mock('../src/Injectors/MeteorConnections', () => ({
  initializeMeteorConnections: vi.fn(),
}))
vi.mock('../src/Injectors/MeteorAdapter', () => ({ MeteorAdapter: vi.fn() }))
vi.mock('../src/Injectors/MinimongoInjector', () => ({
  MinimongoInjector: vi.fn(),
}))

const ORIGINAL_DISCOVERY_CUTOFF_MS = 1000

describe('Meteor injection readiness', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    const browserWindow = {
      postMessage: vi.fn(),
    } as unknown as Window & typeof globalThis
    Object.defineProperty(browserWindow, 'top', { value: browserWindow })

    vi.stubGlobal('window', browserWindow)
    vi.stubGlobal('self', browserWindow)
    vi.stubGlobal('location', {
      host: '127.0.0.1:2200',
      href: 'http://127.0.0.1:2200/',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('initializes once when Meteor appears after the former cutoff', () => {
    injectAll()
    vi.advanceTimersByTime(ORIGINAL_DISCOVERY_CUTOFF_MS + 500)

    const connection = {}
    const ddp = {}
    const mongo = {}
    vi.stubGlobal('Meteor', { connection })
    vi.stubGlobal('DDP', ddp)
    vi.stubGlobal('Mongo', mongo)
    vi.advanceTimersByTime(10)

    expect(initializeMeteorConnections).toHaveBeenCalledOnce()
    expect(initializeMeteorConnections).toHaveBeenCalledWith(
      connection,
      ddp,
      mongo,
    )
    expect(DDPInjector).toHaveBeenCalledOnce()
    expect(MinimongoInjector).toHaveBeenCalledOnce()
    expect(MeteorAdapter).toHaveBeenCalledOnce()
    expect(initializePlayground).toHaveBeenCalledOnce()
    expect(globalThis.__meteor_devtools_evolved).toBe(true)
    expect(vi.getTimerCount()).toBe(0)

    vi.advanceTimersByTime(20_000)
    expect(initializeMeteorConnections).toHaveBeenCalledOnce()
  })

  it('stops polling when Meteor never appears', () => {
    injectAll()
    vi.runAllTimers()

    expect(vi.getTimerCount()).toBe(0)
    expect(initializeMeteorConnections).not.toHaveBeenCalled()
  })
})

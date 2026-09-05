import { getMeteorConnections } from '../MeteorConnections'
import { createNativeProvider } from './NativeProvider'
import { playgroundPageEpoch } from './PageEpoch'
import { PlaygroundRunner, type RunnerEvent } from './Runner'
import {
  resolveRuntimeCapabilities,
  runtimeProperty,
} from './RuntimeCapabilities'

interface PlaygroundBridge {
  register(
    eventType: EventType,
    handler: (message: Message<unknown>) => void,
  ): void
  emit(event: RunnerEvent): void
}

/**
 * Installs one document-owned runner. A panel lease owns operations; losing the
 * panel cannot leave an unbounded live probe behind in the application page.
 */
export const initializePlayground = (bridge: PlaygroundBridge): void => {
  const hello = () =>
    bridge.emit({ kind: 'hello', pageEpoch: playgroundPageEpoch })
  bridge.register('playground:hello', hello)
  let runner: PlaygroundRunner | undefined
  try {
    const capabilities = resolveRuntimeCapabilities(globalThis)
    const provider = createNativeProvider({
      registry: getMeteorConnections(),
      pageUrl: globalThis.location.href,
      connect: (endpoint, options) => DDP.connect(endpoint, options),
      accounts: () =>
        runtimeProperty(globalThis, 'Accounts') ??
        runtimeProperty(
          runtimeProperty(
            runtimeProperty(globalThis, 'Package'),
            'accounts-base',
          ),
          'Accounts',
        ),
    })
    runner = new PlaygroundRunner({
      ...capabilities,
      ...provider,
      pageEpoch: playgroundPageEpoch,
      emit: bridge.emit,
    })
  } catch {
    // Keep passive connection inspection available on unsupported runtimes.
    hello()
  }
  bridge.register('playground:command', message => {
    if (runner) runner.handle(message.data)
    else
      bridge.emit({
        kind: 'error',
        message: 'Native Playground capability unavailable on this page.',
      })
  })
  globalThis.addEventListener('pagehide', () => runner?.dispose(), {
    once: true,
  })
}

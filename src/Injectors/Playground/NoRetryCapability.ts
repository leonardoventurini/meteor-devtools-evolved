/**
 * Exercises the native allocator with a detached, inert connection receiver.
 * No source fields, stubs, transport, or methods are inherited. Both supported
 * native implementations allocate an invoker here; the option must survive.
 * This checks native capability, not integrity against a page replacing its own
 * methods with malicious closures. It never invokes a user-supplied expression.
 *
 * Keep the function self-contained so browser tests execute this exact probe
 * against installed Meteor runtimes, not a duplicated approximation.
 */
export const assertNoRetryCapability = (connection: unknown): void => {
  const unavailable =
    'No-retry capability unavailable on the selected connection.'
  try {
    if (connection === null || typeof connection !== 'object')
      throw new Error(unavailable)
    const allocate: unknown = Reflect.get(connection, '_apply')
    if (typeof allocate !== 'function') throw new Error(unavailable)
    const callback = () => {}
    const invokers: Record<string, unknown> = Object.create(null) as Record<
      string,
      unknown
    >
    const receiver = {
      _nextMethodId: 1,
      _methodInvokers: invokers,
      _outstandingMethodBlocks: [],
      _getIsSimulation: () => false,
      _send: () => {},
      _addOutstandingMethod: () => {},
    }
    Reflect.apply(allocate, receiver, [
      '__meteor_devtools_capability_probe__',
      {
        hasStub: false,
        alreadyInSimulation: false,
        randomSeed: { value: null },
      },
      [],
      { noRetry: true, onResultReceived: callback, _returnMethodInvoker: true },
      callback,
    ])
    const allocated = Object.values(invokers)
    if (allocated.length !== 1) throw new Error(unavailable)
    const invoker = allocated[0]
    if (
      invoker === null ||
      typeof invoker !== 'object' ||
      Reflect.get(invoker, 'noRetry') !== true ||
      Reflect.get(invoker, '_onResultReceived') !== callback
    )
      throw new Error(unavailable)
  } catch {
    throw new Error(unavailable)
  }
}

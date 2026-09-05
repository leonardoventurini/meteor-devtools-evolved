import { JSONUtils } from '@/Utils/JSONUtils'
import { resolveRuntimeCapabilities } from '@/Injectors/Playground/RuntimeCapabilities'
import { parseParameters } from '@/Playground/Values'

export const getSubscriptions = (connection: DDPConnection) => {
  const payload = Object.fromEntries(
    Object.entries(connection._subscriptions ?? {}).map(([id, value]) => {
      const subscription = { ...value }
      Reflect.deleteProperty(subscription, 'connection')
      Reflect.deleteProperty(subscription, 'readyDeps')
      try {
        const encoded = resolveRuntimeCapabilities(globalThis).codec.encode(
          value.params,
        )
        return [
          id,
          {
            ...subscription,
            playgroundParameters: parseParameters(JSON.stringify(encoded)),
          },
        ]
      } catch {
        return [
          id,
          {
            ...subscription,
            playgroundParametersError:
              'Native EJSON parameters unavailable for this subscription.',
          },
        ]
      }
    }),
  )

  return JSONUtils.stringify(payload)
}

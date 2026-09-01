import { JSONUtils } from '@/Utils/JSONUtils'
import { mapValues, omit } from '@/Utils/Objects'

export const getSubscriptions = (connection: DDPConnection) => {
  const payload = mapValues(connection._subscriptions ?? {}, (value: any) =>
    omit(value, ['connection', 'readyDeps']),
  )

  return JSONUtils.stringify(payload)
}

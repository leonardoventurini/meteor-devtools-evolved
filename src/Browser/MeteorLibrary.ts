import { JSONUtils } from '@/Utils/JSONUtils'
import { mapValues, omit } from '@/Utils/Objects'

export const getSubscriptions = () => {
  const payload = mapValues(
    Meteor?.connection?._subscriptions ?? {},
    (value: any) => omit(value, ['connection', 'readyDeps']),
  )

  return JSONUtils.stringify(payload)
}

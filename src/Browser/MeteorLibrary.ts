import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import { JSONUtils } from '@/Utils/JSONUtils'

export const getSubscriptions = () => {
 const payload = mapValues(
  Meteor?.connection?._subscriptions ?? {},
  (value: any) => omit(value, ['connection', 'readyDeps']),
 )

 return JSONUtils.stringify(payload)
}

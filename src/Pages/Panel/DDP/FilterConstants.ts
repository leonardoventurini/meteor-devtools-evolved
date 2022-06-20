import { toPairs } from 'lodash'

export const FilterCriteria: FilterTypeMap<string[]> = {
 heartbeat: ['ping', 'pong'],
 subscription: ['sub', 'unsub', 'nosub', 'ready'],
 collection: ['added', 'removed', 'changed'],
 method: ['method', 'result', 'updated'],
 connection: ['connect', 'connected', 'failed'],
}

export const FilterCriteriaMap: {
 [key: string]: FilterType
} = toPairs(FilterCriteria).reduce(
 (previous: any, [key, matchers]) => ({
  ...previous,
  ...matchers.reduce(
   (previous, matcher) => ({
    ...previous,
    [matcher]: key,
   }),
   {},
  ),
 }),
 {},
)

export const detectType = (content?: DDPLogContent) => {
 if (content && content.msg && content.msg in FilterCriteriaMap) {
  return FilterCriteriaMap[content.msg]
 }

 return null
}

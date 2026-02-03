export const FilterCriteria: FilterTypeMap<string[]> = {
  heartbeat: ['ping', 'pong'],
  subscription: ['sub', 'unsub', 'nosub', 'ready'],
  collection: ['added', 'removed', 'changed'],
  method: ['method', 'result', 'updated'],
  connection: ['connect', 'connected', 'failed'],
}

export const FilterCriteriaMap: {
  [key: string]: FilterType
} = Object.fromEntries(
  Object.entries(FilterCriteria).flatMap(([key, matchers]) =>
    matchers.map(matcher => [matcher, key]),
  ),
)

export const detectType = (content?: DDPLogContent) => {
  if (content && content.msg && content.msg in FilterCriteriaMap) {
    return FilterCriteriaMap[content.msg]
  }

  return null
}

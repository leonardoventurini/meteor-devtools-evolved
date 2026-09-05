import { PLAYGROUND_LIMITS } from '../../Playground/Limits'

const streams = new WeakMap<object, Set<string>>()
const identifiers = (raw: string): string[] => {
  try {
    const frame = JSON.parse(raw) as Record<string, unknown>
    if (!frame || typeof frame !== 'object') return []
    if (typeof frame.id === 'string') {
      if (frame.msg === 'method' || frame.msg === 'result')
        return [`method:${frame.id}`]
      if (['sub', 'unsub', 'nosub'].includes(String(frame.msg)))
        return [`sub:${frame.id}`]
    }
    let ids: unknown
    if (frame.msg === 'ready') ids = frame.subs
    if (frame.msg === 'updated') ids = frame.methods
    return Array.isArray(ids)
      ? ids
          .filter((id): id is string => typeof id === 'string')
          .map(id => `${frame.msg === 'ready' ? 'sub' : 'method'}:${id}`)
      : []
  } catch {
    return []
  }
}

/**
 * Retains protocol identifiers only, never request payloads. Adapters mark
 * native dispatch before ordinary instrumentation forwards its capture event.
 */
export const markPlaygroundFrame = (stream: object, raw: string): void => {
  let ids = streams.get(stream)
  if (!ids) {
    ids = new Set()
    streams.set(stream, ids)
  }
  for (const id of identifiers(raw)) ids.add(id)
  while (ids.size > PLAYGROUND_LIMITS.requestLedger) {
    const oldest = ids.values().next().value
    if (oldest === undefined) break
    ids.delete(oldest)
  }
}

export const getFrameProvenance = (
  stream: object,
  raw: string,
): 'application' | 'playground' => {
  const ids = identifiers(raw)
  return ids.length > 0 && ids.every(id => streams.get(stream)?.has(id))
    ? 'playground'
    : 'application'
}

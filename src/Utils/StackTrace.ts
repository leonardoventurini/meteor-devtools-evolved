const CHROME_NAMED_FRAME = /^at (.+?) \((.+):(\d+):(\d+)\)$/
const CHROME_ANONYMOUS_FRAME = /^at (.+):(\d+):(\d+)$/
const FIREFOX_FRAME = /^(.*?)@(.+):(\d+):(\d+)$/

const INTERNAL_CALLEE_PATTERNS = [
  /^Meteor\.connection\._stream\.send$/,
  /^Connection\._send$/,
  /^ConnectionStreamHandlers\./,
  /^Generator\.next$/,
  /^asyncGeneratorStep$/,
  /^_next$/,
  /^getStackTrace$/,
  /^sendLogMessage$/,
]

const INTERNAL_URL_PATTERNS = [
  /\/(?:packages|node_modules)\/(?:ddp|meteor|promise|ecmascript-runtime)/,
  /\/(?:content-scripts\/content|inject)\.js(?:$|\?)/,
  /^(?:chrome|moz)-extension:\/\//,
]

const parseLocation = (
  raw: string,
  callee: string,
  url: string,
  line: string,
  column: string,
): StackTrace => ({
  raw,
  callee: callee || 'Anonymous',
  url,
  line: Number(line),
  column: Number(column),
})

const classifyStackFrame = (frame: StackTrace): StackTrace => {
  const isInternal =
    INTERNAL_CALLEE_PATTERNS.some(pattern => pattern.test(frame.callee)) ||
    (frame.url
      ? INTERNAL_URL_PATTERNS.some(pattern => pattern.test(frame.url ?? ''))
      : false)
  const isApplication = Boolean(
    !isInternal &&
    frame.url &&
    /^https?:\/\//.test(frame.url) &&
    !/\/(?:packages|node_modules)\//.test(frame.url),
  )

  return { ...frame, isInternal, isApplication }
}

export const parseStackTrace = (stack: string): StackTrace[] =>
  stack
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !/^\w*Error(?::|$)/.test(line))
    .map(raw => {
      const chromeNamedMatch = CHROME_NAMED_FRAME.exec(raw)
      if (chromeNamedMatch) {
        return parseLocation(
          raw,
          chromeNamedMatch[1],
          chromeNamedMatch[2],
          chromeNamedMatch[3],
          chromeNamedMatch[4],
        )
      }

      const chromeAnonymousMatch = CHROME_ANONYMOUS_FRAME.exec(raw)
      if (chromeAnonymousMatch) {
        return parseLocation(
          raw,
          'Anonymous',
          chromeAnonymousMatch[1],
          chromeAnonymousMatch[2],
          chromeAnonymousMatch[3],
        )
      }

      const firefoxMatch = FIREFOX_FRAME.exec(raw)
      if (firefoxMatch) {
        return parseLocation(
          raw,
          firefoxMatch[1] || 'Anonymous',
          firefoxMatch[2],
          firefoxMatch[3],
          firefoxMatch[4],
        )
      }

      return { raw, callee: raw }
    })
    .map(frame => classifyStackFrame(frame))

const framesMatch = (left: StackTrace, right: StackTrace) =>
  left.callee === right.callee &&
  left.url === right.url &&
  left.line === right.line &&
  left.column === right.column

export const collapseStackFrames = (frames: StackTrace[]): StackTrace[] => {
  const collapsed: StackTrace[] = []

  for (const frame of frames) {
    const existingFrame = collapsed.find(candidate =>
      framesMatch(candidate, frame),
    )

    if (existingFrame) {
      existingFrame.occurrences = (existingFrame.occurrences ?? 1) + 1
      continue
    }

    collapsed.push({ ...frame, occurrences: 1 })
  }

  return collapsed
}

export const getCleanStackFrames = (frames: StackTrace[]): StackTrace[] =>
  collapseStackFrames(frames.filter(frame => !frame.isInternal))

export interface TreeFilterResult {
  matched: boolean
  value: unknown
}

export interface TreeMatchSegment {
  isMatch: boolean
  text: string
}

export const splitTreeMatch = (
  text: string,
  search: string,
): TreeMatchSegment[] => {
  const query = search.trim().toLowerCase()

  if (!query) return [{ isMatch: false, text }]

  const normalizedText = text.toLowerCase()
  const segments: TreeMatchSegment[] = []
  let cursor = 0
  let matchIndex = normalizedText.indexOf(query, cursor)

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      segments.push({ isMatch: false, text: text.slice(cursor, matchIndex) })
    }

    const matchEnd = matchIndex + query.length
    segments.push({ isMatch: true, text: text.slice(matchIndex, matchEnd) })
    cursor = matchEnd
    matchIndex = normalizedText.indexOf(query, cursor)
  }

  if (cursor < text.length) {
    segments.push({ isMatch: false, text: text.slice(cursor) })
  }

  return segments.length > 0 ? segments : [{ isMatch: false, text }]
}

const matchesQuery = (value: unknown, query: string): boolean =>
  String(value).toLowerCase().includes(query)

const filterValue = (value: unknown, query: string): TreeFilterResult => {
  if (Array.isArray(value)) {
    const filtered: unknown[] = []
    filtered.length = value.length
    let matched = false

    for (const [index, child] of value.entries()) {
      if (matchesQuery(index, query)) {
        filtered[index] = child
        matched = true
        continue
      }

      const childResult = filterValue(child, query)

      if (childResult.matched) {
        filtered[index] = childResult.value
        matched = true
      }
    }

    return { matched, value: matched ? filtered : undefined }
  }

  if (value !== null && typeof value === 'object') {
    const filtered: Record<string, unknown> = {}
    let matched = false

    for (const [key, child] of Object.entries(value)) {
      if (matchesQuery(key, query)) {
        filtered[key] = child
        matched = true
        continue
      }

      const childResult = filterValue(child, query)

      if (childResult.matched) {
        filtered[key] = childResult.value
        matched = true
      }
    }

    return { matched, value: matched ? filtered : undefined }
  }

  const matched = matchesQuery(value, query)

  return { matched, value: matched ? value : undefined }
}

export const filterJsonTree = (
  value: unknown,
  search: string,
): TreeFilterResult => {
  const query = search.trim().toLowerCase()

  if (!query) return { matched: true, value }

  return filterValue(value, query)
}

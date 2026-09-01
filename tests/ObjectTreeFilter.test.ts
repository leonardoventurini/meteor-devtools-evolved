import { describe, expect, it } from 'vitest'
import {
  filterJsonTree,
  splitTreeMatch,
} from '../src/Utils/ObjectTreerinator/TreeFilter'

const document = {
  _id: 'document-id',
  profile: {
    name: 'Ada Lovelace',
    role: 'mathematician',
  },
  status: 'active',
  visits: [
    { city: 'London', count: 2 },
    { city: 'Paris', count: 1 },
  ],
}

describe('JSON tree filtering', () => {
  it('preserves ancestors of a case-insensitive value match', () => {
    expect(filterJsonTree(document, 'LOVELACE')).toEqual({
      matched: true,
      value: { profile: { name: 'Ada Lovelace' } },
    })
  })

  it('keeps the complete value beneath a matching key', () => {
    expect(filterJsonTree(document, 'profile')).toEqual({
      matched: true,
      value: { profile: document.profile },
    })
  })

  it('retains original array indexes for matching descendants', () => {
    const result = filterJsonTree(document, 'Paris')
    const visits = (result.value as typeof document).visits

    expect(result.matched).toBe(true)
    expect(visits).toHaveLength(2)
    expect(0 in visits).toBe(false)
    expect(visits[1]).toEqual({ city: 'Paris' })
  })

  it('returns the original tree for an empty query', () => {
    expect(filterJsonTree(document, '  ')).toEqual({
      matched: true,
      value: document,
    })
  })

  it('reports a missing match without fabricating a value', () => {
    expect(filterJsonTree(document, 'missing')).toEqual({
      matched: false,
      value: undefined,
    })
  })

  it('splits case-insensitive matches without changing displayed text', () => {
    expect(splitTreeMatch('Ada LOVELACE', 'lovelace')).toEqual([
      { isMatch: false, text: 'Ada ' },
      { isMatch: true, text: 'LOVELACE' },
    ])
  })
})

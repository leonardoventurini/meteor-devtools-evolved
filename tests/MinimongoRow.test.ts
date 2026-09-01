import { describe, expect, it } from 'vitest'
import { formatDocumentId } from '../src/Pages/Panel/Minimongo/MinimongoRow'

describe('Minimongo document ID formatting', () => {
  it.each([
    ['string-id', 'string-id'],
    [42, '42'],
    [{ value: 'object-id' }, '{"value":"object-id"}'],
    [undefined, '(no _id)'],
  ])('formats %j as %s', (id, expected) => {
    expect(formatDocumentId(id)).toBe(expected)
  })
})

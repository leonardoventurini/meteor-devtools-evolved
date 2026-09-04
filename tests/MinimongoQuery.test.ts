import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  executeMinimongoQuery,
  parseMinimongoQuery,
} from '../src/Utils/MinimongoQuery'

const documents = [
  { _id: 'a', profile: { age: 36, name: 'Ada' }, status: 'active' },
  { _id: 'g', profile: { age: 30, name: 'Grace' }, status: 'active' },
  { _id: 'l', profile: { age: 25, name: 'Linus' }, status: 'inactive' },
]

describe('structured Minimongo queries', () => {
  it('filters dotted fields through an explicit operator allowlist', () => {
    const query = parseMinimongoQuery({
      limit: '100',
      projection: '{}',
      selector: '{"profile.age":{"$gte":30},"status":{"$in":["active"]}}',
      sort: '{}',
    })

    expect(executeMinimongoQuery(documents, query)).toEqual(
      documents.slice(0, 2),
    )
  })

  it('accepts Compass-style keys and null operands', () => {
    const query = parseMinimongoQuery({
      limit: '100',
      projection: '{}',
      selector: '{ "name": { $ne: null } }',
      sort: '{name: 1}',
    })
    const values = [{ name: 'Ada' }, { name: null }, {}]

    expect(executeMinimongoQuery(values, query)).toEqual([{ name: 'Ada' }])
  })

  it('treats blank object fields as empty objects', () => {
    const query = parseMinimongoQuery({
      limit: '100',
      projection: ' ',
      selector: '',
      sort: '\n',
    })

    expect(query).toMatchObject({ projection: {}, selector: {}, sort: {} })
  })

  it('sorts, limits, and applies an inclusion projection with _id', () => {
    const query = parseMinimongoQuery({
      limit: '2',
      projection: '{"profile.name":1}',
      selector: '{}',
      sort: '{"profile.age":-1}',
    })

    expect(executeMinimongoQuery(documents, query)).toEqual([
      { _id: 'a', profile: { name: 'Ada' } },
      { _id: 'g', profile: { name: 'Grace' } },
    ])
  })

  it('supports exclusion projections', () => {
    const query = parseMinimongoQuery({
      limit: '100',
      projection: '{"status":0}',
      selector: '{"_id":{"$ne":"g"}}',
      sort: '{}',
    })

    expect(executeMinimongoQuery(documents, query)).toEqual([
      { _id: 'a', profile: { age: 36, name: 'Ada' } },
      { _id: 'l', profile: { age: 25, name: 'Linus' } },
    ])
  })

  it.each([
    ['{"$where":"this.profile.age > 30"}', '{}', '100'],
    ['{}', '{"status":0,"profile.name":1}', '100'],
    ['{}', '{}', '0'],
    ['{}', '{}', '501'],
  ])('rejects unsafe or invalid input', (selector, projection, limit) => {
    expect(() =>
      parseMinimongoQuery({ projection, selector, sort: '{}', limit }),
    ).toThrow()
  })

  it('does not use arbitrary code evaluation', () => {
    const source = readFileSync(
      path.resolve(import.meta.dirname, '../src/Utils/MinimongoQuery.ts'),
      'utf8',
    )

    expect(source).not.toMatch(/\beval\s*\(|new\s+Function|Function\s*\(/)
  })
})

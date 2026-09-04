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

  it('supports literal substring matching on string fields', () => {
    const query = parseMinimongoQuery({
      limit: '100',
      projection: '{}',
      selector: '{"profile.name": {$contains: "da"}}',
      sort: '{}',
    })

    expect(executeMinimongoQuery(documents, query)).toEqual([documents[0]])
  })

  it('supports Mongo regex objects with native options', () => {
    const query = parseMinimongoQuery({
      limit: '100',
      projection: '{}',
      selector: '{"profile.name": {$regex: "^(ada|grace)$", $options: "i"}}',
      sort: '{}',
    })

    expect(executeMinimongoQuery(documents, query)).toEqual(
      documents.slice(0, 2),
    )
  })

  it('combines literal and object-form regex options', () => {
    const query = parseMinimongoQuery({
      limit: '100',
      projection: '{}',
      selector: '{status: {$regex: /^ACTIVE$/, $options: "i"}}',
      sort: '{}',
    })

    expect(executeMinimongoQuery(documents, query)).toEqual(
      documents.slice(0, 2),
    )
  })

  it('parses Compass regex literals with escapes and character classes', () => {
    const values = [
      { path: 'docs/readme', code: 'A/1' },
      { path: 'src/index', code: 'B/2' },
    ]
    const query = parseMinimongoQuery({
      limit: '100',
      projection: '{}',
      selector: String.raw`{path: /^docs\/readme$/i, code: {$regex: /^[A-C]\/\d$/}}`,
      sort: '{}',
    })

    expect(executeMinimongoQuery(values, query)).toEqual([values[0]])
  })

  it('supports regex literals in membership operators', () => {
    const query = parseMinimongoQuery({
      limit: '100',
      projection: '{}',
      selector: '{"profile.name": {$in: [/^ad/i, /^lin/i]}}',
      sort: '{}',
    })

    expect(executeMinimongoQuery(documents, query)).toEqual([
      documents[0],
      documents[2],
    ])
  })

  it('resets stateful native regexes between documents and executions', () => {
    const query = parseMinimongoQuery({
      limit: '100',
      projection: '{}',
      selector: '{status: /^active$/g}',
      sort: '{}',
    })

    expect(executeMinimongoQuery(documents, query)).toEqual(
      documents.slice(0, 2),
    )
    expect(executeMinimongoQuery(documents, query)).toEqual(
      documents.slice(0, 2),
    )
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

  it('accepts positive integer limits without an upper bound', () => {
    const query = parseMinimongoQuery({
      limit: '1000',
      projection: '{}',
      selector: '{}',
      sort: '{}',
    })

    expect(query.limit).toBe(1000)
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
    ['{}', '{}', '1.5'],
    ['{name: {$contains: 42}}', '{}', '100'],
    ['{name: {$options: "i"}}', '{}', '100'],
    ['{name: {$regex: "["}}', '{}', '100'],
    ['{name: /unterminated}', '{}', '100'],
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

import { describe, expect, it } from 'vitest'
import { PublicationDocuments } from '../src/Playground/Documents'

describe('publication documents', () => {
  it('preserves wire IDs and applies live fields without mutating snapshots', () => {
    const state = new PublicationDocuments({})
    state.observe(
      JSON.stringify({
        msg: 'added',
        collection: '__proto__',
        id: '~wire/id',
        fields: { a: 1, b: null },
      }),
    )
    const first = state.snapshot('success', 'readiness')
    state.observe(
      JSON.stringify({
        msg: 'changed',
        collection: '__proto__',
        id: '~wire/id',
        fields: { a: 2 },
        cleared: ['b'],
      }),
    )
    expect(first.data.documents).toEqual({
      ['__proto__']: { '~wire/id': { a: 1, b: null } },
    })
    expect(state.snapshot('success').data.documents).toEqual({
      ['__proto__']: { '~wire/id': { a: 2 } },
    })
    state.observe(
      JSON.stringify({
        msg: 'removed',
        collection: '__proto__',
        id: '~wire/id',
      }),
    )
    expect(state.snapshot('success').data.documents).toEqual({
      ['__proto__']: {},
    })
  })
  it('retains field-level knowledge without inventing a missing baseline', () => {
    const state = new PublicationDocuments()
    state.observe(
      JSON.stringify({
        msg: 'changed',
        collection: 'items',
        id: '1',
        fields: { known: 1 },
      }),
    )
    expect(state.snapshot('success').completePaths).toContain(
      '/documents/items/1/known',
    )
    expect(state.snapshot('success').completePaths).not.toContain('/documents')
    expect(state.snapshot('success').documentBaseline).toBe('unknown')
  })
  it('ignores heartbeat completeness and rejects unsupported data', () => {
    const state = new PublicationDocuments({})
    for (const msg of ['ping', 'pong', 'connected', 'ready'])
      state.observe(JSON.stringify({ msg }))
    expect(state.snapshot('success').completePaths).toContain('/documents')
    state.observe(
      JSON.stringify({ msg: 'addedBefore', collection: 'items', id: '1' }),
    )
    expect(state.snapshot('success').completePaths).not.toContain('/documents')
    expect(state.reasons.length).toBeGreaterThan(0)
  })
  it('bounds observed frames and materialized documents', () => {
    const state = new PublicationDocuments(
      {},
      { frames: 3, bytes: 10_000, documents: 2 },
    )
    for (let index = 0; index < 3; index++)
      state.observe(
        JSON.stringify({
          msg: 'added',
          collection: 'items',
          id: String(index),
          fields: {},
        }),
      )
    expect(state.snapshot('success').truncated).toBe(true)
    expect(
      Object.keys(
        (
          state.snapshot('success').data.documents as Record<
            string,
            Record<string, unknown>
          >
        ).items!,
      ),
    ).toHaveLength(2)
  })
})

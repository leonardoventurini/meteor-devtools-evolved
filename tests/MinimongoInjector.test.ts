import { describe, expect, it } from 'vitest'
import { cleanupDocument } from '../src/Utils/Minimongo'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const injectionSource = readFileSync(
  path.resolve(import.meta.dirname, '../src/Browser/Inject.ts'),
  'utf8',
)

describe('Minimongo document cleanup', () => {
  it('preserves complete documents with falsy and nested values', () => {
    const capturedAt = new Date('2026-08-31T12:00:00.000Z')

    expect(
      cleanupDocument({
        _id: 'document-id',
        count: 0,
        enabled: false,
        label: '',
        optional: null,
        nested: { values: [0, false, null, { capturedAt }] },
      }),
    ).toEqual({
      _id: 'document-id',
      count: 0,
      enabled: false,
      label: '',
      optional: null,
      nested: {
        values: [
          0,
          false,
          null,
          { capturedAt: '[Object::Date] 2026-08-31T12:00:00.000Z' },
        ],
      },
    })
  })

  it('refreshes snapshots on explicit panel requests instead of DDP traffic', () => {
    expect(injectionSource).not.toContain('updateCollections()')
    expect(injectionSource).not.toContain('updateCollections,')
  })
})

import { describe, expect, it } from 'vitest'
import { generateMatrix } from '../src/Playground/Matrix'
import { PLAYGROUND_LIMITS } from '../src/Playground/Limits'

describe('bounded parameter matrices', () => {
  it('changes one field per variant and leaves its baseline untouched', () => {
    const parameters = [{ a: 1, b: 2 }]
    const variants = generateMatrix(parameters, {
      includeBaseline: true,
      changes: ['a', 'b'].map(key => ({
        path: `/0/${key}`,
        candidates: [{ kind: 'null' as const }],
      })),
    })
    expect(variants.map(variant => variant.parameters)).toEqual([
      [{ a: 1, b: 2 }],
      [{ a: null, b: 2 }],
      [{ a: 1, b: null }],
    ])
    variants[0]!.parameters.push('edited')
    expect(parameters).toEqual([{ a: 1, b: 2 }])
  })

  it('deduplicates canonical effective arguments including baseline', () => {
    expect(
      generateMatrix([{ a: 1, b: 2 }], {
        includeBaseline: true,
        changes: [
          {
            path: '/0',
            candidates: [
              { kind: 'value', value: { b: 2, a: 1 } },
              { kind: 'null' },
              { kind: 'value', value: null },
            ],
          },
        ],
      }),
    ).toHaveLength(2)
  })

  it('generates deterministic boundaries and supplied alternate IDs', () => {
    const variants = generateMatrix([7], {
      includeBaseline: false,
      changes: [
        {
          path: '/0',
          candidates: [
            { kind: 'numeric-boundary', boundary: 10 },
            { kind: 'string-boundary', length: 2 },
            { kind: 'alternate-id', value: 'owned-by-other-test-account' },
            { kind: 'wrong-type' },
          ],
        },
      ],
    })
    expect(variants.map(variant => variant.parameters[0])).toEqual([
      9,
      10,
      11,
      'a',
      'aa',
      'aaa',
      'owned-by-other-test-account',
      '',
      false,
      [],
      {},
    ])
  })

  it('supports escaped keys, object deletion, and trailing positional deletion', () => {
    expect(
      generateMatrix([{ 'a/b~': 1 }, 'last'], {
        includeBaseline: false,
        changes: [
          { path: '/0/a~1b~0', candidates: [{ kind: 'missing' }] },
          { path: '/1', candidates: [{ kind: 'missing' }] },
        ],
      }).map(variant => variant.parameters),
    ).toEqual([[{}, 'last'], [{ 'a/b~': 1 }]])
  })

  it.each(['/0', '/0/items/0'])(
    'rejects non-trailing array deletion at %s',
    path => {
      expect(() =>
        generateMatrix([{ items: [1, 2] }, 'last'], {
          includeBaseline: false,
          changes: [{ path, candidates: [{ kind: 'missing' }] }],
        }),
      ).toThrow('trailing')
    },
  )

  it.each([
    '',
    '0',
    '/01',
    '/0/missing',
    '/0/__proto__',
    '/0/constructor',
    '/0/prototype',
    '/0/a~2b',
  ])('rejects invalid or unsafe pointer %s', path => {
    expect(() =>
      generateMatrix([{}], {
        includeBaseline: false,
        changes: [{ path, candidates: [{ kind: 'null' }] }],
      }),
    ).toThrow()
  })

  it('enforces the effective variant cap including baseline', () => {
    const changes = [
      {
        path: '/0',
        candidates: Array.from(
          { length: PLAYGROUND_LIMITS.matrixVariants },
          (_, value) => ({ kind: 'value' as const, value }),
        ),
      },
    ]
    expect(
      generateMatrix([-1], { includeBaseline: false, changes }),
    ).toHaveLength(20)
    expect(() =>
      generateMatrix([-1], { includeBaseline: true, changes }),
    ).toThrow('20')
  })

  it('preserves encoded EJSON candidates and detaches them from the preview', () => {
    const value = { $type: 'fixture', $value: { id: 7 } }
    const variants = generateMatrix([null], {
      includeBaseline: false,
      changes: [{ path: '/0', candidates: [{ kind: 'value', value }] }],
    })
    expect(variants[0]!.parameters).toEqual([value])
    value.$value.id = 8
    expect(variants[0]!.parameters).toEqual([
      { $type: 'fixture', $value: { id: 7 } },
    ])
  })

  it('checks the whole effective request against the byte limit', () => {
    const value = 'é'.repeat(PLAYGROUND_LIMITS.requestBytes / 2)
    expect(() =>
      generateMatrix([0], {
        includeBaseline: false,
        changes: [{ path: '/0', candidates: [{ kind: 'value', value }] }],
      }),
    ).toThrow('256 KiB')
  })

  it('rejects excessive string generation and invalid numeric boundaries', () => {
    for (const candidate of [
      {
        kind: 'string-boundary' as const,
        length: PLAYGROUND_LIMITS.requestBytes,
      },
      { kind: 'string-boundary' as const, length: -1 },
      { kind: 'numeric-boundary' as const, boundary: Number.POSITIVE_INFINITY },
    ]) {
      expect(() =>
        generateMatrix([0], {
          includeBaseline: false,
          changes: [{ path: '/0', candidates: [candidate] }],
        }),
      ).toThrow()
    }
  })
})

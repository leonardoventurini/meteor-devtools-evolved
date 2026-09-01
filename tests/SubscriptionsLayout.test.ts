import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SUBSCRIPTION_COLUMNS } from '../src/Pages/Panel/Subscriptions/SubscriptionLayout'

const source = readFileSync(
  path.resolve(
    import.meta.dirname,
    '../src/Pages/Panel/Subscriptions/Subscriptions.tsx',
  ),
  'utf8',
)

describe('subscription table layout', () => {
  it('gives Params the remaining width after bounded metadata columns', () => {
    expect(SUBSCRIPTION_COLUMNS).toEqual([
      { key: 'id', width: 'clamp(7rem, 14vw, 11rem)' },
      { key: 'name', width: 'clamp(8rem, 22vw, 18rem)' },
      { key: 'params', width: 'auto' },
      { key: 'active', width: '4.5rem' },
      { key: 'ready', width: '4.5rem' },
      { key: 'duration', width: '5.5rem' },
    ])
  })

  it('does not cap Name or Params to a fixed viewport fraction', () => {
    expect(source).not.toContain("maxWidth: '25vw'")
    expect(source).toContain('table-layout: fixed')
  })
})

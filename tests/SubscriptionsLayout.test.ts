import { describe, expect, it } from 'vitest'
import { SUBSCRIPTION_COLUMNS } from '../src/Pages/Panel/Subscriptions/SubscriptionLayout'

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
})

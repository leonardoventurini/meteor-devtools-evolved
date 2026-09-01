import { describe, expect, it } from 'vitest'
import {
  DEFAULT_METEOR_FIXTURE_ID,
  METEOR_FIXTURES,
  resolveMeteorFixture,
} from './e2e/MeteorFixtures'

describe('Meteor browser-integration fixtures', () => {
  it('defines isolated contracts for both supported Meteor generations', () => {
    expect(Object.keys(METEOR_FIXTURES)).toEqual(['devapp-3.5', 'devapp-2.16'])
    expect(METEOR_FIXTURES['devapp-3.5']).toMatchObject({
      release: 'METEOR@3.5.1',
      port: 2100,
      method: { name: 'about' },
      namedCollection: 'links',
    })
    expect(METEOR_FIXTURES['devapp-2.16']).toMatchObject({
      release: 'METEOR@2.16',
      port: 2200,
      method: { name: 'echo' },
      namedCollection: 'random',
    })
  })

  it('defaults to the active fixture and rejects unknown selections', () => {
    expect(resolveMeteorFixture()).toBe(
      METEOR_FIXTURES[DEFAULT_METEOR_FIXTURE_ID],
    )
    expect(() => resolveMeteorFixture('devapp-1')).toThrow(
      'Unknown Meteor E2E fixture "devapp-1"',
    )
  })
})

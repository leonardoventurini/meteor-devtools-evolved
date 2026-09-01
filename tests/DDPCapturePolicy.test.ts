import { describe, expect, it } from 'vitest'
import { shouldCaptureDDPStack } from '../src/Browser/Inject'

const createLog = (overrides: Partial<DDPLog> = {}): DDPLog => ({
  id: 'log-id',
  content: '{"msg":"method","method":"save"}',
  timestamp: 1,
  ...overrides,
})

describe('DDP capture policy', () => {
  it('captures an application stack for outbound non-heartbeat messages', () => {
    expect(shouldCaptureDDPStack(createLog({ isOutbound: true }))).toBe(true)
  })

  it('skips inbound stacks that can only describe Meteor dispatch internals', () => {
    expect(shouldCaptureDDPStack(createLog({ isInbound: true }))).toBe(false)
  })

  it.each(['{"msg":"ping"}', '{"msg":"pong"}'])(
    'skips heartbeat stack capture for %s',
    content => {
      expect(
        shouldCaptureDDPStack(createLog({ content, isOutbound: true })),
      ).toBe(false)
    },
  )
})

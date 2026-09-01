/* eslint-disable unicorn/no-this-outside-of-class -- Stream instrumentation must preserve Meteor's receiver. */
import { describe, expect, it, vi } from 'vitest'
import { instrumentDDPConnection } from '../src/Injectors/DDPInjector'

describe('connection-scoped DDP instrumentation', () => {
  it('tags inbound and outbound events with the connection identity', () => {
    let inboundHandler: ((content: string) => void) | undefined
    const originalSend = vi.fn(function (this: { marker: string }) {
      expect(this.marker).toBe('stream')
      return 'send-result'
    })
    const stream = {
      marker: 'stream',
      on: vi.fn((event: string, handler: (content: string) => void) => {
        expect(event).toBe('message')
        inboundHandler = handler
      }),
      send: originalSend,
    }
    const callback = vi.fn()

    instrumentDDPConnection(
      {
        connection: { _stream: stream },
        displayName: 'Connection 1',
        id: 'connection-1',
      },
      callback,
    )

    expect(stream.send('{"msg":"method"}')).toBe('send-result')
    inboundHandler?.('{"msg":"result"}')
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback.mock.calls[0][0]).toMatchObject({
      connectionId: 'connection-1',
      isOutbound: true,
    })
    expect(callback.mock.calls[1][0]).toMatchObject({
      connectionId: 'connection-1',
      isInbound: true,
    })
  })

  it('does not instrument the same connection stream twice', () => {
    const stream = { on: vi.fn(), send: vi.fn() }
    const descriptor = {
      connection: { _stream: stream },
      displayName: 'Default connection',
      id: 'default',
    }
    const callback = vi.fn()

    instrumentDDPConnection(descriptor, callback)
    instrumentDDPConnection(descriptor, callback)

    expect(stream.on).toHaveBeenCalledOnce()
  })
})

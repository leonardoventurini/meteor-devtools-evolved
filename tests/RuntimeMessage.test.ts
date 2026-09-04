import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { trySendRuntimeMessage } from '../src/Browser/RuntimeMessage'

describe('content-script runtime messaging', () => {
  it('reports successful message forwarding', async () => {
    const send = vi.fn().mockResolvedValue(null)
    const message = { eventType: 'ddp-event' }

    await expect(trySendRuntimeMessage(send, message)).resolves.toBe(true)
    expect(send).toHaveBeenCalledWith(message)
  })

  it('contains synchronous invalidated-context failures', async () => {
    const send = vi.fn(() => {
      throw new Error('Extension context invalidated.')
    })

    await expect(trySendRuntimeMessage(send, {})).resolves.toBe(false)
  })

  it('contains asynchronous runtime messaging failures', async () => {
    const send = vi.fn().mockRejectedValue(new Error('Receiving end missing'))

    await expect(trySendRuntimeMessage(send, {})).resolves.toBe(false)
  })

  it('detaches the stale page listener after forwarding fails', () => {
    const source = readFileSync(
      path.resolve(import.meta.dirname, '../src/entrypoints/content.ts'),
      'utf8',
    )

    expect(source).toContain('if (!wasSent)')
    expect(source).toContain(
      "globalThis.removeEventListener('message', messageHandler)",
    )
  })
})

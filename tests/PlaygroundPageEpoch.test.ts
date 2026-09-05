import { expect, it } from 'vitest'
import { createPageEpoch } from '../src/Injectors/Playground/PageEpoch'

it('creates document identities without the secure-context-only randomUUID API', () => {
  let seed = 0
  const random = (bytes: Uint8Array): Uint8Array => {
    bytes.fill(++seed)
    return bytes
  }
  const first = createPageEpoch(random)
  const second = createPageEpoch(random)
  expect(first).toMatch(/^[\da-f]{32}$/)
  expect(first).not.toBe(second)
})

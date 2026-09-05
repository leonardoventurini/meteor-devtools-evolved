import { expect, it } from 'vitest'
import {
  getFrameProvenance,
  markPlaygroundFrame,
} from '../src/Injectors/Playground/CaptureProvenance'

it('keeps tool provenance scoped to the actual stream and protocol identifier', () => {
  const stream = {}
  const raw = JSON.stringify({ msg: 'method', id: '1', method: 'test' })
  markPlaygroundFrame(stream, raw)
  expect(getFrameProvenance(stream, raw)).toBe('playground')
  expect(getFrameProvenance({}, raw)).toBe('application')
  expect(
    getFrameProvenance(stream, JSON.stringify({ msg: 'sub', id: '1' })),
  ).toBe('application')
  expect(
    getFrameProvenance(stream, JSON.stringify({ msg: 'result', id: '1' })),
  ).toBe('playground')
  expect(getFrameProvenance(stream, 'invalid')).toBe('application')
})

import { describe, expect, it, vi } from 'vitest'
import { instrumentCollectionPrototype } from '../src/Injectors/MeteorAdapter'

const createPrototype = (
  methodName: string,
  implementation: (...args: unknown[]) => unknown,
) => {
  const prototype: Record<string, (...args: unknown[]) => unknown> = {}

  Object.defineProperty(prototype, methodName, {
    configurable: true,
    value: implementation,
    writable: true,
  })

  return prototype
}

describe('Meteor collection performance instrumentation', () => {
  it('wraps explicitly supported non-enumerable synchronous methods', () => {
    const prototype = createPrototype('findOne', function () {
      return { _id: 'document-id' }
    })
    const send = vi.fn()

    instrumentCollectionPrototype(prototype, send, () => 10)

    expect(prototype.findOne.call({ _name: 'links' })).toEqual({
      _id: 'document-id',
    })
    expect(send).toHaveBeenCalledWith({
      args: '[]',
      collectionName: 'links',
      key: 'findOne',
      runtime: 0,
      timing: 'sync',
    })
  })

  it('records and preserves synchronous errors', () => {
    const error = new Error('find failed')
    const prototype = createPrototype('find', () => {
      throw error
    })
    const send = vi.fn()

    instrumentCollectionPrototype(prototype, send, () => 10)

    expect(() => prototype.find.call({ _name: 'links' })).toThrow(error)
    expect(send).toHaveBeenCalledOnce()
  })

  it('records asynchronous settlement and preserves resolved values', async () => {
    const prototype = createPrototype('insertAsync', async () => 'document-id')
    const send = vi.fn()
    const now = vi.fn().mockReturnValueOnce(10).mockReturnValueOnce(25)

    instrumentCollectionPrototype(prototype, send, now)

    await expect(
      prototype.insertAsync.call({ _name: 'links' }, { title: 'Meteor' }),
    ).resolves.toBe('document-id')
    expect(send).toHaveBeenCalledWith({
      args: '[{"title":"Meteor"}]',
      collectionName: 'links',
      key: 'insertAsync',
      runtime: 15,
      timing: 'async',
    })
  })

  it('records asynchronous rejection and preserves the error', async () => {
    const error = new Error('insert failed')
    const prototype = createPrototype('insertAsync', async () => {
      throw error
    })
    const send = vi.fn()

    instrumentCollectionPrototype(prototype, send, () => 10)

    await expect(prototype.insertAsync.call({ _name: 'links' })).rejects.toBe(
      error,
    )
    expect(send).toHaveBeenCalledOnce()
  })

  it('does not wrap collection methods more than once', () => {
    const prototype = createPrototype('findOne', () => null)
    const send = vi.fn()

    instrumentCollectionPrototype(prototype, send, () => 10)
    instrumentCollectionPrototype(prototype, send, () => 10)
    prototype.findOne.call({ _name: 'links' })

    expect(send).toHaveBeenCalledOnce()
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Searchable } from '../src/Stores/Common/Searchable'
import { MinimongoStore } from '../src/Stores/Panel/MinimongoStore'

class TestSearchable extends Searchable<number> {
  submit(items: number[]) {
    this.buffer.push(...items)
    this._submitLogs()
  }
}

describe('Searchable collection retention', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('retains every item when no collection limit is configured', () => {
    const searchable = new TestSearchable()

    searchable.submit([1, 2, 3, 4])

    expect(searchable.collection).toEqual([4, 3, 2, 1])
  })

  it('evicts the oldest items after inserting a buffered batch', () => {
    const searchable = new TestSearchable({ collectionLimit: 3 })

    searchable.submit([1, 2])
    searchable.submit([3, 4])

    expect(searchable.collection).toEqual([4, 3, 2])
  })

  it('does not write diagnostics while submitting a hot-path batch', () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
    const searchable = new TestSearchable({ collectionLimit: 3 })

    searchable.submit([1, 2, 3, 4])

    expect(consoleLog).not.toHaveBeenCalled()
  })

  it('does not write diagnostics while wrapping Minimongo documents', () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

    MinimongoStore.wrapDocument({ _id: 'document-id' }, 'documents')

    expect(consoleLog).not.toHaveBeenCalled()
  })
})

import { describe, expect, it } from 'vitest'
import { PerformanceStore } from '../src/Stores/Panel/PerformanceStore'

const createCall = (runtime: number): CallData => ({
  args: '[]',
  collectionName: 'links',
  key: 'findOneAsync',
  runtime,
  timing: 'async',
})

describe('PerformanceStore', () => {
  it('retains timing semantics and computes the average across all calls', () => {
    const store = new PerformanceStore()

    for (const runtime of [10, 20]) {
      store.push(createCall(runtime))
    }

    expect(store.callMap.get('linksfindOneAsync[]')).toMatchObject({
      averageRuntime: 15,
      calls: 2,
      runtime: 30,
      timing: 'async',
    })
  })
})

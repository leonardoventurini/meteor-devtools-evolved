import { action, makeObservable, observable } from 'mobx'
import { debounce, sortBy } from 'lodash'

type AccCallData = {
  collectionName: string
  key: string
  method: string
  args: string
  runtime: number
  updatedAt: number
}

export class PerformanceStore<T> {
  constructor() {
    makeObservable(this)
  }

  callMap = new Map<string, AccCallData>()

  @observable.shallow
  renderData: AccCallData[] = []

  updateRenderData = debounce(
    action(() => {
      this.renderData = sortBy(Array.from(this.callMap.values()), [
        'runtime',
        'args',
        'method',
        'collectionName',
      ]).reverse()
    }),
    250,
    {
      maxWait: 5000,
    },
  )

  push(data: CallData) {
    const key = `${data.collectionName}${data.key}${data.args}`

    if (this.callMap.has(key)) {
      const existingData = this.callMap.get(key)

      this.callMap.set(key, {
        collectionName: data.collectionName,
        key,
        method: data.key,
        args: data.args,
        runtime: (existingData?.runtime ?? 0) + data.runtime,
        updatedAt: Date.now(),
      })
    } else {
      this.callMap.set(key, {
        collectionName: data.collectionName,
        key,
        method: data.key,
        args: data.args,
        runtime: data?.runtime,
        updatedAt: Date.now(),
      })
    }

    this.updateRenderData()
  }

  /**
   * @todo
   *
   * - Implement garbage collection, removing entries which the updatedAt did not change after 30 seconds after the size of the map reaches a certain size.
   */
}

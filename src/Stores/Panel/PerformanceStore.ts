import { action, makeObservable, observable } from 'mobx'
import sortBy from 'lodash.sortby'
import debounce from 'lodash.debounce'

type AccCallData = {
  collectionName: string
  key: string
  method: string
  args: string
  runtime: number
  averageRuntime: number
  updatedAt: number
  calls: number
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
      ])
        .reverse()
        .slice(0, 100)
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

      const runtime = (existingData?.runtime ?? 0) + data.runtime

      this.callMap.set(key, {
        collectionName: data.collectionName,
        key,
        method: data.key,
        args: data.args,
        runtime,
        averageRuntime: runtime / existingData.calls,
        updatedAt: Date.now(),
        calls: existingData.calls + 1,
      })
    } else {
      this.callMap.set(key, {
        collectionName: data.collectionName,
        key,
        method: data.key,
        args: data.args,
        runtime: data?.runtime,
        averageRuntime: data?.runtime,
        updatedAt: Date.now(),
        calls: 1,
      })
    }

    this.updateRenderData()
  }

  @action
  clear() {
    this.callMap.clear()
    this.renderData = []
  }
}

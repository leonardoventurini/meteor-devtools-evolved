import { action, makeObservable, observableShallow } from 'mobx'
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
  timing: CallData['timing']
}

export class PerformanceStore<T> {
  constructor() {
    makeObservable(this, {
      renderData: observableShallow,
      clear: action,
    })
  }

  callMap = new Map<string, AccCallData>()

  renderData: AccCallData[] = []

  updateRenderData = debounce(
    action(() => {
      this.renderData = sortBy(
        [...this.callMap.values()],
        ['runtime', 'args', 'method', 'collectionName'],
      )
        .toReversed()
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
        averageRuntime: runtime / (existingData.calls + 1),
        updatedAt: Date.now(),
        calls: existingData.calls + 1,
        timing: data.timing,
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
        timing: data.timing,
      })
    }

    this.updateRenderData()
  }

  clear() {
    this.callMap.clear()
    this.renderData = []
  }
}

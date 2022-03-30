import { debounce } from 'lodash'
import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import { Searchable } from '../Common/Searchable'
import { PanelStore } from '@/Stores/PanelStore'
import { generatePreview } from '@/Utils/MessageFormatter'

export class DDPStore extends Searchable<DDPLog> {
  @observable inboundBytes = 0
  @observable outboundBytes = 0
  @observable newLogs: string[] = []

  constructor() {
    super()
    makeObservable(this)
  }

  bufferCallback = (buffer: DDPLog[]) => {
    this.buffer = buffer.map((log: DDPLog) => ({
      ...log,
      preview: generatePreview(
        log.content,
        log.parsedContent as DDPLogContent,
        log.filterType,
      ),
    }))

    this.newLogs.push(...buffer.map(({ id }) => id))

    this.inboundBytes += buffer
      .filter(log => log.isInbound)
      .reduce((sum, log) => sum + (log.size ?? 0), 0)

    this.outboundBytes += buffer
      .filter(log => log.isOutbound)
      .reduce((sum, log) => sum + (log.size ?? 0), 0)

    this.clearNewLogs()
  }

  clearNewLogs = debounce(() => {
    runInAction(() => {
      this.newLogs = []
    })
  }, 1000)

  filterFunction = (collection: DDPLog[], search: string) =>
    collection
      .filter(log => !this.filterRegularExpression.test(log.content))
      .filter(
        log =>
          !search ||
          log.content
            .toLowerCase()
            .concat(log.hash ?? '')
            .concat(log.preview ?? '')
            .includes(search.toLowerCase()),
      )

  @action
  clearLogs() {
    this.collection = []
    this.inboundBytes = 0
    this.outboundBytes = 0
  }

  @computed
  get filterRegularExpression() {
    return new RegExp(
      `"msg":"(${PanelStore.settingStore.activeFilterBlacklist.join('|')})"`,
    )
  }
}

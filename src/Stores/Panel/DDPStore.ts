import { debounce } from 'lodash'
import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import { Searchable } from '../Common/Searchable'
import { PanelStore } from '@/Stores/PanelStore'
import { generatePreview } from '@/Utils/MessageFormatter'
import { clearCache } from '@/Bridge'

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
      .concat(log.preview ?? '')
      .includes(search.toLowerCase()),
   )

 @action
 clearLogs() {
  this.collection = []
  this.inboundBytes = 0
  this.outboundBytes = 0

  clearCache()
 }

 @computed
 get filterRegularExpression() {
  return new RegExp(
   `"msg":"(${PanelStore.settingStore.activeFilterBlacklist.join('|')})"`,
  )
 }

 @computed
 get subscriptionLogs() {
  return this.collection.filter(
   log => log.parsedContent.msg === 'ready' || log.parsedContent.msg === 'sub',
  )
 }

 getSubscriptionInit(subscription) {
  return this.subscriptionLogs.find(
   log => log.parsedContent.id === subscription.id,
  )
 }

 getSubscriptionReady(subscription) {
  return this.subscriptionLogs.find(log =>
   log.parsedContent.subs?.includes?.(subscription.id),
  )
 }

 getSubscriptionDuration(subscription) {
  const initLog = this.getSubscriptionInit(subscription)
  const readyLog = this.getSubscriptionReady(subscription)

  if (initLog && readyLog) return `${readyLog.timestamp - initLog.timestamp}ms`

  if (readyLog) return `???`

  if (initLog) return `waiting`

  return 'NA'
 }

 getSubscriptionMeta(subscription) {
  return {
   meta: {
    init: this.getSubscriptionInit(subscription),
    ready: this.getSubscriptionReady(subscription),
   },
  }
 }
}

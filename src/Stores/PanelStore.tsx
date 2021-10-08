import { action, observable, toJS } from 'mobx'
import React, { createContext, FunctionComponent } from 'react'
import { BookmarkStore } from './Panel/BookmarkStore'
import { DDPStore } from './Panel/DDPStore'
import { MinimongoStore } from './Panel/MinimongoStore'
import { PanelPage } from '@/Constants'
import { SettingStore } from '@/Stores/Panel/SettingStore'
import { SubscriptionStore } from '@/Stores/Panel/SubscriptionStore'

export class PanelStoreConstructor {
  @observable selectedTabId: string = PanelPage.DDP

  @observable activeObjectTitle: string | null = null
  @observable activeObject: ViewableObject = null
  @observable.shallow activeStackTrace: StackTrace[] | null = null

  @observable isAboutVisible = false
  @observable subscriptions: Record<string, IMeteorSubscription> = {}

  @observable gitCommitHash?: string | null = null

  ddpStore = new DDPStore()
  bookmarkStore = new BookmarkStore()
  minimongoStore = new MinimongoStore()
  subscriptionStore = new SubscriptionStore()
  settingStore = new SettingStore()

  constructor() {
    this.bookmarkStore.sync().catch(console.error)
  }

  @action
  syncSubscriptions(subscriptions: Record<MeteorID, IMeteorSubscription>) {
    this.subscriptionStore.setCollection(Object.values(subscriptions))
  }

  @action
  setActiveObject(viewableObject: ViewableObject, title: string | null = null) {
    this.activeObject = viewableObject
    this.activeObjectTitle = title
  }

  @action
  setActiveStackTrace(trace: StackTrace[] | null) {
    this.activeStackTrace = trace
  }

  @action
  setSelectedTabId(selectedTabId: string) {
    this.selectedTabId = selectedTabId
  }

  @action
  setAboutVisible(isAboutVisible: boolean) {
    this.isAboutVisible = isAboutVisible
  }

  @action
  getSubscriptionById(id: string) {
    const subs = toJS(this.subscriptions)

    return id in subs ? subs[id] : null
  }

  @action
  setGitCommitHash(hash: string) {
    this.gitCommitHash = hash
  }
}

export const PanelStore = new PanelStoreConstructor()

const PanelStoreContext = createContext<PanelStoreConstructor | null>(null)

export const PanelStoreProvider: FunctionComponent = ({ children }) => (
  <PanelStoreContext.Provider value={PanelStore}>
    {children}
  </PanelStoreContext.Provider>
)

export const usePanelStore = () => {
  const store = React.useContext(PanelStoreContext)

  if (!store) {
    throw new Error('Must be used within a provider.')
  }

  return store
}

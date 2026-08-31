import {
  action,
  makeObservable,
  observable,
  observableShallow,
  toJS,
} from 'mobx'
import React, {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useContext,
} from 'react'
import { BookmarkStore } from './Panel/BookmarkStore'
import { DDPStore } from './Panel/DDPStore'
import { MinimongoStore } from './Panel/MinimongoStore'
import { PanelPage } from '@/Constants'
import { SettingStore } from '@/Stores/Panel/SettingStore'
import { SubscriptionStore } from '@/Stores/Panel/SubscriptionStore'
import { PerformanceStore } from './Panel/PerformanceStore'

export class PanelStoreConstructor {
  selectedTabId: string = PanelPage.DDP

  activeObjectTitle: string | null = null
  activeObject: ViewableObject = null
  activeStackTrace: StackTrace[] | null = null

  isHelpDrawerVisible = false
  subscriptions: Record<string, IMeteorSubscription> = {}

  gitCommitHash?: string | null = null

  ddpStore = new DDPStore()
  bookmarkStore = new BookmarkStore()
  minimongoStore = new MinimongoStore()
  subscriptionStore = new SubscriptionStore()
  settingStore = new SettingStore()
  performanceStore = new PerformanceStore()

  constructor() {
    makeObservable(this, {
      selectedTabId: observable,
      activeObjectTitle: observable,
      activeObject: observable,
      activeStackTrace: observableShallow,
      isHelpDrawerVisible: observable,
      subscriptions: observable,
      gitCommitHash: observable,
      syncSubscriptions: action,
      setActiveObject: action,
      setActiveStackTrace: action,
      setSelectedTabId: action,
      setHelpDrawerVisible: action,
      getSubscriptionById: action,
      setGitCommitHash: action,
    })

    this.bookmarkStore.sync().catch(console.error)
  }

  syncSubscriptions(subscriptions: Record<MeteorID, IMeteorSubscription>) {
    this.subscriptionStore.setCollection(Object.values(subscriptions))
  }

  setActiveObject(viewableObject: ViewableObject, title: string | null = null) {
    this.activeObject = viewableObject
    this.activeObjectTitle = title
  }

  setActiveStackTrace(trace: StackTrace[] | null) {
    this.activeStackTrace = trace
  }

  setSelectedTabId(selectedTabId: string) {
    this.selectedTabId = selectedTabId
  }

  setHelpDrawerVisible(isHelpDrawerVisible: boolean) {
    this.isHelpDrawerVisible = isHelpDrawerVisible
  }

  getSubscriptionById(id: string) {
    const subs = toJS(this.subscriptions)

    return id in subs ? subs[id] : null
  }

  setGitCommitHash(hash: string) {
    this.gitCommitHash = hash
  }
}

export const PanelStore = new PanelStoreConstructor()

const PanelStoreContext = createContext<PanelStoreConstructor | null>(null)

export const PanelStoreProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => (
  <PanelStoreContext.Provider value={PanelStore}>
    {children}
  </PanelStoreContext.Provider>
)

export const usePanelStore = () => {
  const store = useContext(PanelStoreContext)

  if (!store) {
    throw new Error('Must be used within a provider.')
  }

  return store
}

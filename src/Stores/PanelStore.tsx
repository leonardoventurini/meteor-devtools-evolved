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
import { PlaygroundStore } from './Panel/PlaygroundStore'
import { PerformanceStore } from './Panel/PerformanceStore'

export class PanelStoreConstructor {
  selectedTabId: string = PanelPage.DDP
  activeConnectionId = 'default'
  connections: ConnectionSummary[] = [
    { displayName: 'Default connection', id: 'default' },
  ]

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
  playgroundStore = new PlaygroundStore()

  constructor() {
    makeObservable(this, {
      selectedTabId: observable,
      activeConnectionId: observable,
      connections: observable,
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
      setActiveConnectionId: action,
      setConnections: action,
      setHelpDrawerVisible: action,
      getSubscriptionById: action,
      setGitCommitHash: action,
    })

    this.playgroundStore.setConnections(this.connections)
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

  setActiveConnectionId(connectionId: string) {
    if (this.connections.some(connection => connection.id === connectionId)) {
      this.activeConnectionId = connectionId
      this.playgroundStore.selectConnection(connectionId)
      this.minimongoStore.setActiveConnectionId(connectionId)
      this.subscriptionStore.setCollection([])
      this.minimongoStore.setCollections({})
    }
  }

  setConnections(connections: ConnectionSummary[]) {
    this.connections = connections
    this.playgroundStore.setConnections(connections)

    if (!connections.some(({ id }) => id === this.activeConnectionId)) {
      this.activeConnectionId = connections[0]?.id ?? 'default'
      this.minimongoStore.setActiveConnectionId(this.activeConnectionId)
    }
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

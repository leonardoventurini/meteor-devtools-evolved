import { GITHUB_REPOSITORY_URL, PanelPage } from '@/Constants'
import React, { FunctionComponent } from 'react'
import { usePanelStore } from '@/Stores/PanelStore'
import { observer } from 'mobx-react-lite'
import { syncConnectionData, syncMinimongo, syncSubscriptions } from '@/Bridge'
import { IMenuItem, ITab, TabBar } from '@/Components/TabBar'
import { openTab } from '@/Utils/BackgroundEvents'
import { ConnectionSelector } from './ConnectionSelector'

export const Navigation: FunctionComponent = observer(() => {
  const panelStore = usePanelStore()

  const tabs: ITab[] = [
    {
      key: PanelPage.DDP,
      content: 'DDP',
      icon: 'changes',
    },
    {
      key: PanelPage.PLAYGROUND,
      content: 'Playground',
      icon: 'lab-test',
    },
    {
      key: PanelPage.BOOKMARKS,
      content: 'Bookmarks',
      icon: 'star',
    },
    {
      key: PanelPage.MINIMONGO,
      content: 'Minimongo',
      icon: 'database',
      handler: () => {
        // Fetch collection data from the page.
        syncMinimongo()
      },
    },
    {
      key: PanelPage.SUBSCRIPTIONS,
      content: 'Subscriptions',
      icon: 'feed-subscribed',
      handler: () => {
        syncSubscriptions()
      },
    },
    {
      key: PanelPage.PERFORMANCE,
      content: 'Performance',
      icon: 'lightning',
    },
    {
      key: PanelPage.SETTINGS,
      content: 'Settings',
      icon: 'cog',
      placement: 'bottom',
    },
  ]

  const menu: IMenuItem[] = [
    {
      key: 'star',
      icon: 'star',
      content: <strong>Star</strong>,
      shine: true,
      handler: () => openTab(`${GITHUB_REPOSITORY_URL}/stargazers`),
    },
    {
      key: 'feedback',
      icon: 'issue',
      content: <strong>Issues</strong>,
      shine: true,
      handler: () => openTab(`${GITHUB_REPOSITORY_URL}/issues`),
    },
    {
      key: 'help',
      icon: 'help',
      content: 'Help',
      shine: true,
      handler: () => {
        panelStore.setHelpDrawerVisible(true)
      },
    },
    {
      key: 'reload',
      icon: 'refresh',
      content: 'Reload',
      handler: () => location.reload(),
      shine: true,
    },
  ]

  return (
    <TabBar
      activeKey={panelStore.selectedTabId}
      tabs={tabs}
      menu={menu}
      onChange={key => panelStore.setSelectedTabId(key)}
      beforeMenu={
        <ConnectionSelector
          activeConnectionId={panelStore.activeConnectionId}
          connections={panelStore.connections}
          onChange={connectionId => {
            panelStore.setActiveConnectionId(connectionId)
            syncConnectionData(connectionId)
          }}
        />
      }
    />
  )
})

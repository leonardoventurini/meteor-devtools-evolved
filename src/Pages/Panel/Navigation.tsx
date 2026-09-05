import { PanelPage } from '@/Constants'
import React, { FunctionComponent, useEffect } from 'react'
import { usePanelStore } from '@/Stores/PanelStore'
import { observer } from 'mobx-react-lite'
import { syncConnectionData, syncMinimongo, syncSubscriptions } from '@/Bridge'
import { IMenuItem, ITab, TabBar } from '@/Components/TabBar'
import { Tag } from '@blueprintjs/core'
import { isNumber } from 'lodash'
import { openTab } from '@/Utils/BackgroundEvents'
import { ConnectionSelector } from './ConnectionSelector'

export const Navigation: FunctionComponent = observer(() => {
  const panelStore = usePanelStore()

  useEffect(() => {
    setTimeout(() => {
      panelStore.settingStore.updateRepositoryData()
    }, 2000)
  }, [])

  const { repositoryData } = panelStore.settingStore

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

  if (repositoryData) {
    menu.unshift(
      {
        key: 'star',
        icon: 'star',
        content: (
          <>
            <strong>Star</strong>
            {isNumber(repositoryData.stargazers_count) ? (
              <Tag minimal round style={{ marginLeft: '.5rem' }}>
                {repositoryData.stargazers_count}
              </Tag>
            ) : null}
          </>
        ),
        shine: true,
        handler: () => {
          openTab(`${repositoryData.html_url}/stargazers`)
        },
      },
      {
        key: 'feedback',
        icon: 'issue',
        content: <strong>Issues</strong>,
        handler: () => {
          openTab(`${repositoryData.html_url}/issues`)
        },
        shine: true,
      },
    )
  }

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

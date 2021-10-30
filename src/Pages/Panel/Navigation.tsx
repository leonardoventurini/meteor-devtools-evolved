import { PanelPage } from '@/Constants'
import React, { FunctionComponent, useEffect } from 'react'
import { usePanelStore } from '@/Stores/PanelStore'
import { observer } from 'mobx-react-lite'
import { Bridge, syncSubscriptions } from '@/Bridge'
import { IMenuItem, ITab, TabBar } from '@/Components/TabBar'
import { Tag } from '@blueprintjs/core'
import { isNumber } from 'lodash'

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
        Bridge.sendContentMessage({
          eventType: 'minimongo-get-collections',
          data: null,
        })
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
  ]

  const menu: IMenuItem[] = [
    {
      key: 'community',
      content: 'Community',
      icon: 'chat',
      handler: () =>
        chrome.tabs.create({
          url: 'https://join.slack.com/t/meteor-community/shared_invite/zt-a9lwcfb7-~UwR3Ng6whEqRxcP5rORZw',
        }),
      shine: true,
    },
    {
      key: 'about',
      content: 'About',
      icon: 'info-sign',
      handler: () => panelStore.setAboutVisible(true),
      shine: true,
    },
  ]

  if (repositoryData) {
    menu.unshift({
      key: 'issue',
      content: (
        <>
          <strong>Issue</strong>
          {isNumber(repositoryData.open_issues_count) ? (
            <Tag minimal round style={{ marginLeft: '.5rem' }}>
              {repositoryData.open_issues_count}
            </Tag>
          ) : null}
        </>
      ),
      icon: 'issue',
      handler: () =>
        chrome.tabs.create({
          url: repositoryData.html_url.concat('/issues'),
        }),
      shine: true,
    })

    menu.unshift({
      key: 'star',
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
      icon: 'star',
      shine: true,
      handler: () =>
        chrome.tabs.create({
          url: repositoryData.html_url.concat('/stargazers'),
        }),
    })
  }

  return (
    <div className='navbar'>
      <TabBar
        tabs={tabs}
        menu={menu}
        onChange={key => panelStore.setSelectedTabId(key)}
      />
    </div>
  )
})

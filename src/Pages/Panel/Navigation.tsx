import { PanelPage } from '@/Constants'
import React, { FunctionComponent, useEffect } from 'react'
import { usePanelStore } from '@/Stores/PanelStore'
import { observer } from 'mobx-react-lite'
import { Bridge, syncSubscriptions } from '@/Bridge'
import { IMenuItem, ITab, TabBar } from '@/Components/TabBar'
import { Tag } from '@blueprintjs/core'
import { isNumber } from 'lodash'
import { useAnalytics } from '@/Utils/Hooks/useAnalytics'
import { openTab } from '@/Utils/BackgroundEvents'

export const Navigation: FunctionComponent = observer(() => {
  const panelStore = usePanelStore()
  const analytics = useAnalytics()

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
      key: 'help',
      icon: 'help',
      content: 'Help',
      shine: true,
      handler: () => {
        panelStore.setHelpDrawerVisible(true)
        analytics?.event('navigation', 'click', { label: 'partners' })
      },
    },
    {
      key: 'monti-apm',
      content: 'Monti APM',
      icon: 'timeline-bar-chart',
      handler: () => {
        openTab('https://app.montiapm.com/')
        analytics?.event('navigation', 'click', { label: 'monti apm' })
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
    menu.unshift({
      key: 'feedback',
      icon: 'issue',
      content: <strong>Issues</strong>,
      handler: () => {
        openTab(repositoryData.html_url.concat('/issues'))
        analytics?.event('navigation', 'click', { label: 'feedback' })
      },
      shine: true,
    })

    menu.unshift({
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
        openTab(repositoryData.html_url.concat('/stargazers'))

        analytics?.event('navigation', 'click', { label: 'star' })
      },
    })
  }

  menu.unshift({
    key: 'sponsor',
    content: <strong>❤️ Sponsor</strong>,
    shine: true,
    title: 'If you find this extension useful, please consider sponsoring',
    handler: () => {
      openTab('https://github.com/sponsors/leonardoventurini')
      analytics?.event('navigation', 'click', { label: 'sponsor' })
    },
  })

  return (
    <div className='mde-navbar'>
      <TabBar
        tabs={tabs}
        menu={menu}
        onChange={key => panelStore.setSelectedTabId(key)}
      />
    </div>
  )
})

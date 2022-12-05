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
      key: 'community',
      content: 'Community',
      icon: 'chat',
      handler: () => {
        openTab(
          'https://join.slack.com/t/meteor-community/shared_invite/zt-a9lwcfb7-~UwR3Ng6whEqRxcP5rORZw',
        )

        analytics?.event('navigation', 'click', { label: 'community' })
      },
      shine: true,
    },
    {
      key: 'about',
      content: 'About',
      icon: 'info-sign',
      handler: () => {
        panelStore.setAboutVisible(true)
        analytics?.event('navigation', 'click', { label: 'about' })
      },
      shine: true,
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
      icon: 'thumbs-up',
      content: (
        <>
          <strong>Feedback</strong>
          {isNumber(repositoryData.open_issues_count) ? (
            <Tag minimal round style={{ marginLeft: '.5rem' }}>
              {repositoryData.open_issues_count}
            </Tag>
          ) : null}
        </>
      ),
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
          <strong>Stargazers</strong>
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
    key: 'learn-meteor',
    content: 'Sapienza Course 🧠',
    shine: true,
    handler: () => {
      openTab(
        'https://www.sapienza.dev/course/meteor?utm_source=chrome_extension&utm_medium=extension&utm_campaign=meteor_devtools_evolved',
      )
      analytics?.event('navigation', 'click', { label: 'learn meteor' })
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

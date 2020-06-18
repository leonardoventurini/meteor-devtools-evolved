import { PanelPage } from '@/Constants';
import React, { FunctionComponent, useEffect } from 'react';
import { usePanelStore } from '@/Stores/PanelStore';
import { observer } from 'mobx-react-lite';
import { Bridge, syncSubscriptions } from '@/Bridge';
import { IMenuItem, ITab, TabBar } from '@/Components/TabBar';
import { Tag } from '@blueprintjs/core';

export const Navigation: FunctionComponent = observer(() => {
  const panelStore = usePanelStore();

  useEffect(() => {
    setTimeout(() => {
      panelStore.settingStore.updateRepositoryData();
    }, 2000);
  }, []);

  const { repositoryData } = panelStore.settingStore;

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
        });
      },
    },
    {
      key: PanelPage.SUBSCRIPTIONS,
      content: 'Subscriptions',
      icon: 'feed-subscribed',
      handler: () => {
        syncSubscriptions();
      },
    },
  ];

  const menu: IMenuItem[] = [
    {
      key: 'about',
      content: 'About',
      icon: <i className='fas fa-question-circle' style={{ marginRight: 4 }} />,
      handler: () => panelStore.setAboutVisible(true),
    },
    {
      key: 'community',
      content: 'Community',
      icon: <i className='fab fa-slack' style={{ marginRight: 4 }} />,
      handler: () =>
        chrome.tabs.create({
          url:
            'https://join.slack.com/t/meteor-community/shared_invite/zt-a9lwcfb7-~UwR3Ng6whEqRxcP5rORZw',
        }),
      shine: true,
    },
  ];

  if (repositoryData) {
    menu.unshift({
      key: 'issue',
      content: (
        <>
          <strong>Issue</strong>
          <Tag minimal round style={{ marginLeft: '.5rem' }}>
            {repositoryData.open_issues}
          </Tag>
        </>
      ),
      icon: (
        <i className='fas fa-exclamation-circle' style={{ marginRight: 4 }} />
      ),
      handler: () =>
        chrome.tabs.create({
          url: repositoryData.html_url.concat('/issues'),
        }),
    });

    menu.unshift({
      key: 'star',
      content: (
        <>
          <strong>Star</strong>
          <Tag minimal round style={{ marginLeft: '.5rem' }}>
            {repositoryData.stargazers_count}
          </Tag>
        </>
      ),
      icon: 'star',
      shine: true,
      handler: () =>
        chrome.tabs.create({
          url: repositoryData.html_url.concat('/stargazers'),
        }),
    });
  }

  return (
    <div className='navbar'>
      <TabBar
        tabs={tabs}
        menu={menu}
        onChange={key => panelStore.setSelectedTabId(key)}
      />
    </div>
  );
});

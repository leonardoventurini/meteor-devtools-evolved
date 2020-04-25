import { PanelPage } from '@/Constants';
import React, { FunctionComponent, useEffect } from 'react';
import { usePanelStore } from '@/Stores/PanelStore';
import { observer } from 'mobx-react-lite';
import { Bridge, syncSubscriptions } from '@/Bridge';
import { IMenuItem, ITab, TabBar } from '@/Pages/Layout/Presentation/TabBar';
import { Tag } from '@blueprintjs/core';

interface Props {
  selectedTabId: string;
  setSelectedTabId(value: string): void;
}

export const Navigation: FunctionComponent<Props> = observer(
  ({ setSelectedTabId, selectedTabId }) => {
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
        icon: 'help',
        handler: () => panelStore.setAboutVisible(true),
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
        icon: 'issue',
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
          onChange={key => setSelectedTabId(key)}
        />
      </div>
    );
  },
);

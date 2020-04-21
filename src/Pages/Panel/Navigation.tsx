import { PanelPage } from '@/Constants';
import { Button, Navbar, Tag } from '@blueprintjs/core';
import React, { FunctionComponent, useEffect } from 'react';
import { usePanelStore } from '@/Stores/PanelStore';
import { observer } from 'mobx-react-lite';
import { Bridge } from '@/Bridge';

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

    return (
      <Navbar className='mde-navbar' fixedToTop>
        <Navbar.Group>
          <Navbar.Heading>
            <img src='icons/meteor-32.png' alt='Meteor DevTools Evolved' />
          </Navbar.Heading>
        </Navbar.Group>
        <Navbar.Group>
          <Button
            icon='changes'
            text='DDP'
            onClick={() => setSelectedTabId(PanelPage.DDP)}
            active={selectedTabId === PanelPage.DDP}
            minimal
            style={{ marginRight: 4 }}
          />
          <Button
            icon='star'
            text='Bookmarks'
            onClick={() => setSelectedTabId(PanelPage.BOOKMARKS)}
            active={selectedTabId === PanelPage.BOOKMARKS}
            minimal
            style={{ marginRight: 4 }}
          />
          <Button
            icon='database'
            text='Minimongo'
            onClick={() => {
              // Fetch collection data from the page.
              Bridge.sendContentMessage({
                eventType: 'minimongo-get-collections',
                data: null,
              });

              setSelectedTabId(PanelPage.MINIMONGO);
            }}
            active={selectedTabId === PanelPage.MINIMONGO}
            minimal
          />
        </Navbar.Group>

        {repositoryData && (
          <Navbar.Group align='right' className='mde-github-actions'>
            <Button
              icon='star'
              onClick={() =>
                chrome.tabs.create({
                  url: repositoryData.html_url.concat('/stargazers'),
                })
              }
              className='bp3-outlined'
            >
              <strong>Star</strong>
              <Tag minimal round style={{ marginLeft: '.5rem' }}>
                {repositoryData.stargazers_count}
              </Tag>
            </Button>
            <Button
              icon='issue'
              onClick={() =>
                chrome.tabs.create({
                  url: repositoryData.html_url.concat('/issues'),
                })
              }
              className='bp3-outlined'
            >
              <strong>Issue</strong>
              <Tag minimal round style={{ marginLeft: '.5rem' }}>
                {repositoryData.open_issues}
              </Tag>
            </Button>

            <Button
              icon='help'
              onClick={() => panelStore.setAboutVisible(true)}
              className='bp3-outlined'
            >
              <strong>About</strong>
            </Button>
          </Navbar.Group>
        )}
      </Navbar>
    );
  },
);

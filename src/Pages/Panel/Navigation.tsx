import { PanelPage } from '@/Constants';
import { Button, Navbar, Tag } from '@blueprintjs/core';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { sendContentMessage } from '@/Bridge';
import { getRepoData } from '@/Utils/GitHub';

interface Props {
  selectedTabId: string;
  setSelectedTabId(value: string): void;
}

export const Navigation: FunctionComponent<Props> = ({
  setSelectedTabId,
  selectedTabId,
}) => {
  const [repoData, setRepoData] = useState(null);

  useEffect(() => {
    getRepoData().then(data => setRepoData(data));
  }, []);

  if (repoData) {
    console.log(repoData);
  }

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
            sendContentMessage({
              eventType: 'minimongo-get-collections',
              data: null,
              source: 'meteor-devtools-evolved',
            });

            setSelectedTabId(PanelPage.MINIMONGO);
          }}
          active={selectedTabId === PanelPage.MINIMONGO}
          minimal
        />
      </Navbar.Group>

      {repoData && (
        <Navbar.Group align='right' className='mde-github-actions'>
          <Button
            icon='star'
            outlined
            onClick={() =>
              chrome.tabs.create({
                url: (repoData as any).html_url.concat('/stargazers'),
              })
            }
          >
            <strong>Star</strong>
            <Tag minimal round style={{ marginLeft: '.5rem' }}>
              {(repoData as any).stargazers_count}
            </Tag>
          </Button>
          <Button
            icon='issue'
            outlined
            onClick={() =>
              chrome.tabs.create({
                url: (repoData as any).html_url.concat('/issues'),
              })
            }
          >
            <strong>Issue</strong>
            <Tag minimal round style={{ marginLeft: '.5rem' }}>
              {(repoData as any).open_issues}
            </Tag>
          </Button>
        </Navbar.Group>
      )}
    </Navbar>
  );
};

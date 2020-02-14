import React, { FunctionComponent } from 'react';
import { Icon, Navbar, Tab, Tabs } from '@blueprintjs/core';

interface Props {
  selectedTabId: string;
  defaultSelectedTabId: string;
  setSelectedTabId(value: string): void;
}

export const Navigation: FunctionComponent<Props> = ({
  selectedTabId,
  defaultSelectedTabId,
  setSelectedTabId,
}) => (
  <Navbar fixedToTop>
    <Navbar.Group>
      <Navbar.Heading>
        <img src='icons/meteor-32.png' alt='Meteor DevTools Evolved' />
      </Navbar.Heading>
    </Navbar.Group>
    <Navbar.Group>
      <Tabs
        defaultSelectedTabId={defaultSelectedTabId}
        selectedTabId={selectedTabId}
        onChange={(newTabId: string) => setSelectedTabId(newTabId)}
      >
        <Tab
          id='ddp'
          title={
            <>
              <Icon icon='globe-network' />
              &nbsp;DDP
            </>
          }
        />
        <Tab
          id='minimongo'
          title={
            <>
              <Icon icon='database' />
              &nbsp;Minimongo
            </>
          }
        />
      </Tabs>
    </Navbar.Group>
  </Navbar>
);

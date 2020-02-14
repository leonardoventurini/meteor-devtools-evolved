import React, { FunctionComponent } from 'react';
import { Navbar, Tab, Tabs } from '@blueprintjs/core';

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
        <img src='icons/meteor-16.png' alt='Meteor DevTools Evolved' />
      </Navbar.Heading>
    </Navbar.Group>
    <Navbar.Group>
      <Tabs
        defaultSelectedTabId={defaultSelectedTabId}
        selectedTabId={selectedTabId}
        onChange={(newTabId: string) => setSelectedTabId(newTabId)}
        large
      >
        <Tab id='ddp' title='DDP' />
        <Tab id='minimongo' title='Minimongo' />
      </Tabs>
    </Navbar.Group>
  </Navbar>
);

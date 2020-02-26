import { PanelPage } from '@/Constants';
import { Button, Navbar } from '@blueprintjs/core';
import React, { FunctionComponent } from 'react';

interface Props {
  selectedTabId: string;
  setSelectedTabId(value: string): void;
}

export const Navigation: FunctionComponent<Props> = ({
  setSelectedTabId,
  selectedTabId,
}) => (
  <Navbar fixedToTop>
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
        onClick={() => setSelectedTabId(PanelPage.MINIMONGO)}
        active={selectedTabId === PanelPage.MINIMONGO}
        minimal
      />
    </Navbar.Group>
  </Navbar>
);

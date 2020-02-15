import React, { FunctionComponent } from 'react';
import { Button, Navbar } from '@blueprintjs/core';

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
        onClick={() => setSelectedTabId('ddp')}
        active={selectedTabId === 'ddp'}
        minimal
      />
      <Button
        icon='database'
        text='Minimongo'
        onClick={() => setSelectedTabId('minimongo')}
        active={selectedTabId === 'minimongo'}
        minimal
      />
    </Navbar.Group>
  </Navbar>
);

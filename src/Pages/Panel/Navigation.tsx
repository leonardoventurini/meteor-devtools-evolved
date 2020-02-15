import React, { FunctionComponent } from 'react';
import { Button, Navbar } from '@blueprintjs/core';

interface Props {
  setSelectedTabId(value: string): void;
}

export const Navigation: FunctionComponent<Props> = ({ setSelectedTabId }) => (
  <Navbar fixedToTop>
    <Navbar.Group>
      <Navbar.Heading>
        <img src='icons/meteor-32.png' alt='Meteor DevTools Evolved' />
      </Navbar.Heading>
    </Navbar.Group>
    <Navbar.Group>
      <Button
        icon='rotate-document'
        text='DDP'
        onClick={() => setSelectedTabId('ddp')}
        minimal
      />
      <Button
        icon='database'
        text='Minimongo'
        onClick={() => setSelectedTabId('minimongo')}
        minimal
      />
    </Navbar.Group>
  </Navbar>
);

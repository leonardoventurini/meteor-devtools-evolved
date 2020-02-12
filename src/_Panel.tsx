import React, { FunctionComponent } from 'react';
import { Alignment, Button, Navbar } from '@blueprintjs/core';
import { setupBridge } from './Bridge';

export const Panel: FunctionComponent = () => {
  setupBridge();

  return (
    <div>
      <Navbar fixedToTop>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>Meteor DevTools Evolved</Navbar.Heading>
          <Navbar.Divider />
          <Button icon='home' text='Home' minimal />
          <Button icon='document' text='DDP' minimal />
        </Navbar.Group>
      </Navbar>
    </div>
  );
};

import React, { FunctionComponent } from 'react';
import { Alignment, Button, Navbar } from '@blueprintjs/core';
import { render } from 'react-dom';

import './Style.scss';

export const App: FunctionComponent = () => (
  <>
    <Navbar fixedToTop>
      <Navbar.Group align={Alignment.LEFT}>
        <Navbar.Heading>Meteor DevTools Evolved</Navbar.Heading>
        <Navbar.Divider />
        <Button icon='home' text='Home' minimal />
        <Button icon='document' text='DDP' minimal />
      </Navbar.Group>
    </Navbar>
  </>
);

render(<App />, document.getElementById('app'));

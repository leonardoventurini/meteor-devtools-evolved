import React from 'react';
import { render } from 'react-dom';

import './Style.scss';
import { Button, Navbar } from '@blueprintjs/core';
import { Alignment } from '@blueprintjs/core/lib/esnext/common/alignment';

const App = () => (
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

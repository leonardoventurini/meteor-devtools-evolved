import React, { FunctionComponent, useState } from 'react';
import { Icon, Navbar, Tab, Tabs } from '@blueprintjs/core';
import { setupBridge } from '../Bridge';
import { DDP } from './Panel/DDP';
import { Minimongo } from './Panel/Minimongo';

export const Panel: FunctionComponent = () => {
  setupBridge();

  const defaultSelectedTabId = 'ddp';

  const [selectedTabId, setSelectedTabId] = useState<string>(
    defaultSelectedTabId,
  );

  const renderTab = (tabId: string) => {
    switch (tabId) {
      case 'ddp':
        return <DDP />;
      case 'minimongo':
        return <Minimongo />;
      default:
        return <DDP />;
    }
  };

  return (
    <>
      <Navbar>
        <Navbar.Group>
          <Navbar.Heading>Meteor DevTools</Navbar.Heading>
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
      <div className='mde-layout__tab-panel'>{renderTab(selectedTabId)}</div>
    </>
  );
};

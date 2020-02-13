import React, { FunctionComponent, useState } from 'react';
import { Icon, Navbar, Tab, Tabs } from '@blueprintjs/core';
import { setupBridge } from '../Bridge';
import { DDP } from './Panel/DDP';
import { Minimongo } from './Panel/Minimongo';
import { PanelStore, PanelStoreConstructor } from '../Stores/PanelStore';
import { inject, observer, Provider } from 'mobx-react';
import { flow } from 'lodash/fp';

interface Props {
  panelStore?: PanelStoreConstructor;
}

const PanelObserver: FunctionComponent<Props> = flow(
  observer,
  inject('panelStore'),
)(({ panelStore }) => {
  setupBridge();

  const defaultSelectedTabId = 'ddp';

  const [selectedTabId, setSelectedTabId] = useState<string>(
    defaultSelectedTabId,
  );

  const renderTab = (tabId: string) => {
    if (panelStore) {
      switch (tabId) {
        case 'ddp':
          return <DDP />;
        case 'minimongo':
          return <Minimongo />;
        default:
          return <DDP />;
      }
    }

    return null;
  };

  return (
    <>
      <Navbar>
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
      <div className='mde-layout__tab-panel'>{renderTab(selectedTabId)}</div>
    </>
  );
});

export const Panel = () => (
  <Provider panelStore={PanelStore}>
    <PanelObserver />
  </Provider>
);

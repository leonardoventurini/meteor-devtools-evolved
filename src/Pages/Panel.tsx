import React, { FunctionComponent, useRef, useState } from 'react';
import { Icon, Navbar, Tab, Tabs } from '@blueprintjs/core';
import { setupBridge } from '../Bridge';
import { DDP } from './Panel/DDP';
import { PanelStore, PanelStoreConstructor } from '../Stores/PanelStore';
import { inject, observer, Provider } from 'mobx-react';
import { flow } from 'lodash/fp';
import { Hideable } from '../Utils/Hideable';
import { defer } from 'lodash';
import { scrollToBottom } from '../Utils';
import { Minimongo } from './Panel/Minimongo';

interface Props {
  panelStore?: PanelStoreConstructor;
}

const PanelObserver: FunctionComponent<Props> = flow(
  observer,
  inject('panelStore'),
)(({ panelStore }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  setupBridge();

  const defaultSelectedTabId = 'ddp';

  const [selectedTabId, setSelectedTabId] = useState<string>(
    defaultSelectedTabId,
  );

  const renderTab = (tabId: string) => {
    if (panelStore) {
      console.log(tabId);

      return (
        <>
          <Hideable isVisible={tabId === 'ddp'}>
            <DDP panelRef={panelRef} />
          </Hideable>

          <Hideable isVisible={tabId === 'minimongo'}>
            <Minimongo />
          </Hideable>
        </>
      );
    }
  };

  defer(() => scrollToBottom(panelRef));

  return (
    <div className='mde-layout'>
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
      <div className='mde-layout__tab-panel' ref={panelRef}>
        {renderTab(selectedTabId)}
      </div>
    </div>
  );
});

export const Panel = () => (
  <Provider panelStore={PanelStore}>
    <PanelObserver />
  </Provider>
);

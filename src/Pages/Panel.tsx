import React, { FunctionComponent, useRef, useState } from 'react';
import { setupBridge } from '../Bridge';
import { DDP } from './Panel/DDP/DDP';
import { PanelStoreProvider } from '../Stores/PanelStore';
import { Minimongo } from './Panel/Minimongo/Minimongo';
import { Navigation } from './Panel/Navigation';
import { DrawerStackTrace } from './Panel/DrawerStackTrace';
import { DrawerLogJSON } from './Panel/DrawerLogJSON';
import { Starred } from './Panel/Starred/Starred';

interface Props {}

const PanelObserverComponent: FunctionComponent<Props> = () => {
  const panelRef = useRef<HTMLDivElement>(null);

  setupBridge();

  const defaultSelectedTabId = 'ddp';

  const [selectedTabId, setSelectedTabId] = useState<string>(
    defaultSelectedTabId,
  );

  const navigationProps = {
    selectedTabId,
    setSelectedTabId,
  };

  return (
    <div className='mde-layout'>
      <DrawerLogJSON />

      <DrawerStackTrace />

      <Navigation {...navigationProps} />

      <div className='mde-layout__tab-panel' ref={panelRef}>
        <DDP isVisible={selectedTabId === 'ddp'} />
        <Minimongo isVisible={selectedTabId === 'minimongo'} />
        <Starred isVisible={selectedTabId === 'starred'} />
      </div>
    </div>
  );
};

export const Panel = () => (
  <PanelStoreProvider>
    <PanelObserverComponent />
  </PanelStoreProvider>
);

import React, { FunctionComponent, useRef, useState } from 'react';
import { DDP } from './Panel/DDP/DDP';
import { PanelStoreProvider, usePanelStore } from '../Stores/PanelStore';
import { Minimongo } from './Panel/Minimongo/Minimongo';
import { Navigation } from './Panel/Navigation';
import { DrawerStackTrace } from './Panel/DrawerStackTrace';
import { DrawerLogJSON } from './Panel/DrawerLogJSON';
import { Starred } from './Panel/Starred/Starred';
import { setupBridge } from '../Bridge';
import { observer } from 'mobx-react-lite';

setupBridge();

interface Props {}

const PanelObserverComponent: FunctionComponent<Props> = observer(() => {
  const store = usePanelStore();
  const panelRef = useRef<HTMLDivElement>(null);

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
      <DrawerLogJSON
        activeLog={store.activeLog}
        onClose={() => store.setActiveLog(null)}
      />

      <DrawerStackTrace
        activeStackTrace={store.activeStackTrace}
        onClose={() => store.setActiveStackTrace(null)}
      />

      <Navigation {...navigationProps} />

      <div className='mde-layout__tab-panel' ref={panelRef}>
        <DDP isVisible={selectedTabId === 'ddp'} />
        <Minimongo isVisible={selectedTabId === 'minimongo'} />
        <Starred isVisible={selectedTabId === 'starred'} />
      </div>
    </div>
  );
});

export const Panel = () => (
  <PanelStoreProvider>
    <PanelObserverComponent />
  </PanelStoreProvider>
);

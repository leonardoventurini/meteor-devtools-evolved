import React, { FunctionComponent, useRef, useState } from 'react';
import { setupBridge } from '../Bridge';
import { DDP } from './Panel/DDP/DDP';
import { PanelStoreProvider, usePanelStore } from '../Stores/PanelStore';
import { Hideable } from '../Utils/Hideable';
import { Minimongo } from './Panel/Minimongo/Minimongo';
import { Navigation } from './Panel/Navigation';
import { DrawerStackTrace } from './Panel/DrawerStackTrace';
import { DrawerLogJSON } from './Panel/DrawerLogJSON';
import { observer } from 'mobx-react-lite';

interface Props {}

const PanelObserverComponent: FunctionComponent<Props> = observer(() => {
  const panelRef = useRef<HTMLDivElement>(null);
  const panelStore = usePanelStore();

  setupBridge();

  const defaultSelectedTabId = 'ddp';

  const [selectedTabId, setSelectedTabId] = useState<string>(
    defaultSelectedTabId,
  );

  const renderTab = (tabId: string) => {
    if (panelStore) {
      return (
        <>
          <Hideable isVisible={tabId === 'ddp'}>
            <DDP />
          </Hideable>

          <Hideable isVisible={tabId === 'minimongo'}>
            <Minimongo />
          </Hideable>
        </>
      );
    }
  };

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
        {renderTab(selectedTabId)}
      </div>
    </div>
  );
});

export const Panel = () => (
  <PanelStoreProvider>
    <PanelObserverComponent />
  </PanelStoreProvider>
);

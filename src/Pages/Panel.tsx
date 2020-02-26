import { setupBridge } from '@/Bridge';
import { PanelPage } from '@/Constants';
import { PanelStoreProvider, usePanelStore } from '@/Stores/PanelStore';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent, useRef, useState } from 'react';
import { Bookmarks } from './Panel/Bookmarks/Bookmarks';
import { DDP } from './Panel/DDP/DDP';
import { DrawerLogJSON } from './Panel/DrawerLogJSON';
import { DrawerStackTrace } from './Panel/DrawerStackTrace';
import { Minimongo } from './Panel/Minimongo/Minimongo';
import { Navigation } from './Panel/Navigation';

setupBridge();

interface Props {}

const PanelObserverComponent: FunctionComponent<Props> = observer(() => {
  const store = usePanelStore();
  const panelRef = useRef<HTMLDivElement>(null);

  const defaultSelectedTabId = PanelPage.DDP;

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
        <DDP isVisible={selectedTabId === PanelPage.DDP} />
        <Bookmarks isVisible={selectedTabId === PanelPage.BOOKMARKS} />
        <Minimongo isVisible={selectedTabId === PanelPage.MINIMONGO} />
      </div>
    </div>
  );
});

export const Panel = () => (
  <PanelStoreProvider>
    <PanelObserverComponent />
  </PanelStoreProvider>
);

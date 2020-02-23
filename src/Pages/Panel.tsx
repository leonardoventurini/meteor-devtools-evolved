import React, { FunctionComponent, useRef, useState } from 'react';
import { DDP } from './Panel/DDP/DDP';
import { PanelStoreProvider, usePanelStore } from '../Stores/PanelStore';
import { Minimongo } from './Panel/Minimongo/Minimongo';
import { Navigation } from './Panel/Navigation';
import { DrawerStackTrace } from './Panel/DrawerStackTrace';
import { DrawerLogJSON } from './Panel/DrawerLogJSON';
import { Bookmarks } from './Panel/Bookmarks/Bookmarks';
import { setupBridge } from '../Bridge';
import { observer } from 'mobx-react-lite';
import { PanelPage } from '../Constants';

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

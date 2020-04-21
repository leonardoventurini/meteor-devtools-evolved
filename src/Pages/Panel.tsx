import { PanelPage } from '@/Constants';
import { PanelStoreProvider, usePanelStore } from '@/Stores/PanelStore';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent, useRef } from 'react';
import { Bookmarks } from './Panel/Bookmarks/Bookmarks';
import { DDP } from './Panel/DDP/DDP';
import { DrawerJSON } from './Panel/DrawerJSON';
import { DrawerStackTrace } from './Panel/DrawerStackTrace';
import { Minimongo } from './Panel/Minimongo/Minimongo';
import { Navigation } from './Panel/Navigation';
import { About } from '@/Pages/Panel/About';
import { Bridge } from '@/Bridge';

Bridge.init();

interface Props {}

const PanelObserverComponent: FunctionComponent<Props> = observer(() => {
  const store = usePanelStore();
  const panelRef = useRef<HTMLDivElement>(null);

  const navigationProps = {
    selectedTabId: store.selectedTabId,
    setSelectedTabId: store.setSelectedTabId.bind(store),
  };

  return (
    <div className='mde-layout'>
      <DrawerJSON
        viewableObject={store.activeObject}
        onClose={() => store.setActiveObject(null)}
      />

      <DrawerStackTrace
        activeStackTrace={store.activeStackTrace}
        onClose={() => store.setActiveStackTrace(null)}
      />

      <About
        isAboutVisible={store.isAboutVisible}
        onClose={() => store.setAboutVisible(false)}
      />

      <Navigation {...navigationProps} />

      <div className='mde-layout__tab-panel' ref={panelRef}>
        <DDP isVisible={store.selectedTabId === PanelPage.DDP} />
        <Bookmarks isVisible={store.selectedTabId === PanelPage.BOOKMARKS} />
        <Minimongo isVisible={store.selectedTabId === PanelPage.MINIMONGO} />
      </div>
    </div>
  );
});

export const Panel = () => (
  <PanelStoreProvider>
    <PanelObserverComponent />
  </PanelStoreProvider>
);

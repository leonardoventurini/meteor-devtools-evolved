import { PanelStoreProvider, usePanelStore } from '@/Stores/PanelStore'
import { observer } from 'mobx-react-lite'
import React, { FunctionComponent } from 'react'
import { Bookmarks } from './Panel/Bookmarks/Bookmarks'
import { DDP } from './Panel/DDP/DDP'
import { DrawerJSON } from './Panel/DrawerJSON'
import { DrawerStackTrace } from './Panel/DrawerStackTrace'
import { Minimongo } from './Panel/Minimongo/Minimongo'
import { Navigation } from './Panel/Navigation'
import { Bridge } from '@/Bridge'
import { PanelPage } from '@/Constants'
import { Subscriptions } from '@/Pages/Panel/Subscriptions/Subscriptions'
import { Performance } from '@/Pages/Panel/Performance/Performance'
import { HelpDrawer } from './Panel/HelpDrawer'
import { Playground } from './Panel/Playground/Playground'
import { Settings } from './Panel/Settings/Settings'
import { PanelLayout } from './Panel/PanelLayout'

Bridge.init()

const PanelObserverComponent: FunctionComponent = observer(() => {
  const store = usePanelStore()
  return (
    <PanelLayout>
      <DrawerJSON
        title={store.activeObjectTitle}
        viewableObject={store.activeObject}
        onClose={() => {
          store.setActiveObject(null, null)
        }}
      />

      <DrawerStackTrace
        activeStackTrace={store.activeStackTrace}
        onClose={() => store.setActiveStackTrace(null)}
      />

      <HelpDrawer
        isHelpDrawerVisible={store.isHelpDrawerVisible}
        onClose={() => store.setHelpDrawerVisible(false)}
      />

      <Navigation />

      <div className='mde-layout__tab-panel'>
        <DDP isVisible={store.selectedTabId === PanelPage.DDP} />
        <Playground isVisible={store.selectedTabId === PanelPage.PLAYGROUND} />
        <Bookmarks isVisible={store.selectedTabId === PanelPage.BOOKMARKS} />
        <Minimongo isVisible={store.selectedTabId === PanelPage.MINIMONGO} />
        <Performance
          isVisible={store.selectedTabId === PanelPage.PERFORMANCE}
        />
        <Subscriptions
          isVisible={store.selectedTabId === PanelPage.SUBSCRIPTIONS}
        />
        <Settings isVisible={store.selectedTabId === PanelPage.SETTINGS} />
      </div>
    </PanelLayout>
  )
})

export const Panel = () => (
  <PanelStoreProvider>
    <PanelObserverComponent />
  </PanelStoreProvider>
)

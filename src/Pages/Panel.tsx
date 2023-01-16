import { PanelStoreProvider, usePanelStore } from '@/Stores/PanelStore'
import { observer } from 'mobx-react-lite'
import React, { FunctionComponent, useEffect, useRef } from 'react'
import { Bookmarks } from './Panel/Bookmarks/Bookmarks'
import { DDP } from './Panel/DDP/DDP'
import { DrawerJSON } from './Panel/DrawerJSON'
import { DrawerStackTrace } from './Panel/DrawerStackTrace'
import { Minimongo } from './Panel/Minimongo/Minimongo'
import { Navigation } from './Panel/Navigation'
import { Bridge } from '@/Bridge'
import { PanelPage } from '@/Constants'
import { Subscriptions } from '@/Pages/Panel/Subscriptions/Subscriptions'
import styled from 'styled-components'
import {
  MIN_LAYOUT_WIDTH,
  NAVBAR_HEIGHT,
  STATUS_HEIGHT,
} from '@/Styles/Constants'
import { Performance } from '@/Pages/Panel/Performance/Performance'
import { useAnalytics } from '@/Utils/Hooks/useAnalytics'
import { HelpDrawer } from './Panel/HelpDrawer'

Bridge.init()

const Layout = styled.div`
  display: flex;
  flex-direction: column;

  position: relative;

  padding-top: ${NAVBAR_HEIGHT}px;
  padding-bottom: ${STATUS_HEIGHT}px;
  max-height: 100vh;

  min-width: ${MIN_LAYOUT_WIDTH}px;

  .mde-navbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
  }

  .mde-layout__tab-panel {
    position: relative;

    .mde-content {
      height: calc(100vh - ${NAVBAR_HEIGHT + STATUS_HEIGHT}px);
      padding: 0;
      overflow: hidden;
    }
  }
`

const PanelObserverComponent: FunctionComponent = observer(() => {
  const store = usePanelStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const analytics = useAnalytics()

  useEffect(() => {
    // eslint-disable-next-line no-console
    analytics?.pageView().catch(console.error)
  }, [analytics])

  return (
    <Layout>
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

      <div className='mde-layout__tab-panel' ref={panelRef}>
        <DDP isVisible={store.selectedTabId === PanelPage.DDP} />
        <Bookmarks isVisible={store.selectedTabId === PanelPage.BOOKMARKS} />
        <Minimongo isVisible={store.selectedTabId === PanelPage.MINIMONGO} />
        <Performance
          isVisible={store.selectedTabId === PanelPage.PERFORMANCE}
        />
        <Subscriptions
          isVisible={store.selectedTabId === PanelPage.SUBSCRIPTIONS}
        />
      </div>
    </Layout>
  )
})

export const Panel = () => (
  <PanelStoreProvider>
    <PanelObserverComponent />
  </PanelStoreProvider>
)

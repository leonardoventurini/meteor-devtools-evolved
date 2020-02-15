import React, { FunctionComponent, useRef, useState } from 'react';
import { setupBridge } from '../Bridge';
import { DDP } from './Panel/DDP/DDP';
import { PanelStore, PanelStoreConstructor } from '../Stores/PanelStore';
import { inject, observer, Provider } from 'mobx-react';
import { flow } from 'lodash/fp';
import { Hideable } from '../Utils/Hideable';
import { Minimongo } from './Panel/Minimongo/Minimongo';
import { Navigation } from './Panel/Navigation';
import { Classes, Drawer } from '@blueprintjs/core';
import JSONTree from 'react-json-tree';
import { JSONTreeTheme } from './Panel/JSONTreeTheme';

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
      <Drawer
        icon='document'
        title='JSON'
        isOpen={!!panelStore?.activeLog}
        onClose={() => {
          panelStore?.setActiveLog(null);
        }}
      >
        <div className={Classes.DRAWER_BODY}>
          <div className={Classes.DIALOG_BODY}>
            {panelStore?.activeLog && (
              <JSONTree
                data={JSON.parse(panelStore?.activeLog.content)}
                theme={JSONTreeTheme}
                shouldExpandNode={() => true}
                invertTheme={false}
                hideRoot
              />
            )}
          </div>
        </div>
      </Drawer>

      <Drawer
        icon='document'
        title='Stack Trace'
        isOpen={!!panelStore?.activeStackTrace}
        onClose={() => {
          panelStore?.setActiveStackTrace(null);
        }}
      >
        <div className={Classes.DRAWER_BODY}>
          <div className={Classes.DIALOG_BODY}>
            {panelStore?.activeStackTrace?.map(
              (stack: StackTrace, index: number) => {
                const text = (
                  <div>
                    <em>{stack?.functionName?.trim() ?? 'Anonymous'}</em>
                    {'@'}
                    <span>
                      {stack?.columnNumber && stack?.columnNumber}
                      {stack?.columnNumber && stack?.lineNumber ? ':' : null}
                      {stack?.lineNumber && stack?.lineNumber}
                    </span>
                  </div>
                );

                return (
                  <pre key={index} style={{ marginBottom: 6 }}>
                    {stack?.fileName ? (
                      <a
                        href={stack.fileName.trim()}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        {text}
                      </a>
                    ) : (
                      text
                    )}
                  </pre>
                );
              },
            )}
          </div>
        </div>
      </Drawer>

      <Navigation {...navigationProps} />

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

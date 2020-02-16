import React, { FunctionComponent } from 'react';
import { Classes, Drawer } from '@blueprintjs/core';
import JSONTree from 'react-json-tree';
import { JSONTreeTheme } from './JSONTreeTheme';
import { usePanelStore } from '../../Stores/PanelStore';
import { observer } from 'mobx-react-lite';

export const DrawerLogJSON: FunctionComponent = observer(() => {
  const panelStore = usePanelStore();

  return (
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
  );
});

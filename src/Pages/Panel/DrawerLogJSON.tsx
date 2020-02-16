import React, { FunctionComponent } from 'react';
import { Classes, Drawer } from '@blueprintjs/core';
import JSONTree from 'react-json-tree';
import { JSONTreeTheme } from './JSONTreeTheme';
import { PanelStoreConstructor } from '../../Stores/PanelStore';
import { flow } from 'lodash/fp';
import { inject, observer } from 'mobx-react';

interface Props {
  panelStore?: PanelStoreConstructor;
}

const DrawerLogJSONComponent: FunctionComponent<Props> = ({ panelStore }) => (
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

export const DrawerLogJSON = flow(
  observer,
  inject('panelStore'),
)(DrawerLogJSONComponent);

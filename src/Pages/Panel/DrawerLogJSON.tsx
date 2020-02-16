import React, { FunctionComponent } from 'react';
import { Classes, Drawer } from '@blueprintjs/core';
import JSONTree from 'react-json-tree';
import { JSONTreeTheme } from './JSONTreeTheme';

interface Props {
  activeLog: DDPLog | null;
  onClose(): void;
}

export const DrawerLogJSON: FunctionComponent<Props> = ({
  activeLog,
  onClose,
}) => {
  return (
    <Drawer icon='document' title='JSON' isOpen={!!activeLog} onClose={onClose}>
      <div className={Classes.DRAWER_BODY}>
        <div className={Classes.DIALOG_BODY}>
          {activeLog && (
            <JSONTree
              data={JSON.parse(activeLog.content)}
              theme={JSONTreeTheme}
              shouldExpandNode={(
                keyPath: (string | number)[],
                data: [any] | {},
                level: number,
              ) => level <= 3}
              invertTheme={false}
              hideRoot
            />
          )}
        </div>
      </div>
    </Drawer>
  );
};

import React, { FunctionComponent } from 'react';
import { Classes, Drawer } from '@blueprintjs/core';
import { ObjectTree } from '../../Utils/ObjectTree';

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
          {activeLog && <ObjectTree object={activeLog?.parsedContent} />}
        </div>
      </div>
    </Drawer>
  );
};

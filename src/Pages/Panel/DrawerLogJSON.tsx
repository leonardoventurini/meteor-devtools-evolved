import { ObjectTree } from '@/Utils/ObjectTree';
import { Classes, Drawer } from '@blueprintjs/core';
import React, { FunctionComponent } from 'react';

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

import { ObjectTreerinator } from '@/Utils/ObjectTreerinator';
import { Classes, Drawer } from '@blueprintjs/core';
import React, { FunctionComponent } from 'react';

interface Props {
  viewableObject: ViewableObject;
  onClose(): void;
}

export const DrawerJSON: FunctionComponent<Props> = ({
  viewableObject,
  onClose,
}) => {
  return (
    <Drawer
      icon='document'
      title='JSON'
      isOpen={!!viewableObject}
      onClose={onClose}
    >
      <div className={Classes.DRAWER_BODY}>
        <div className={Classes.DIALOG_BODY}>
          {!!viewableObject && <ObjectTreerinator object={viewableObject} />}
        </div>
      </div>
    </Drawer>
  );
};

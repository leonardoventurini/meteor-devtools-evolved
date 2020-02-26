import { Button, Menu, MenuItem, Popover, Position } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from 'react';
import { usePanelStore } from '../../../Stores/PanelStore';
import { Hideable } from '../../../Utils/Hideable';
import { ObjectTree } from '../../../Utils/ObjectTree';
import { StatusBar } from '../../Layout/StatusBar';

interface Props {
  isVisible: boolean;
}

export const Minimongo: FunctionComponent<Props> = observer(({ isVisible }) => {
  const { minimongoStore } = usePanelStore();

  const isActiveCollectionMissing =
    minimongoStore.activeCollection &&
    !(minimongoStore.activeCollection in minimongoStore.collections);

  if (isActiveCollectionMissing) {
    minimongoStore.setActiveCollection(null);
  }

  return (
    <Hideable isVisible={isVisible}>
      <ObjectTree object={minimongoStore.collections} />

      <StatusBar>
        <div style={{ marginRight: 'auto' }}>
          <Popover
            content={
              <Menu>
                {Object.keys(minimongoStore.collections).map(key => (
                  <MenuItem
                    key={key}
                    icon='database'
                    text={key}
                    active={minimongoStore.activeCollection === key}
                    onClick={() => minimongoStore.setActiveCollection(key)}
                  />
                ))}
              </Menu>
            }
            position={Position.RIGHT_TOP}
          >
            <Button
              icon={minimongoStore.activeCollection ? 'database' : null}
              text={minimongoStore.activeCollection || 'Select Collection'}
            />
          </Popover>
        </div>
      </StatusBar>
    </Hideable>
  );
});

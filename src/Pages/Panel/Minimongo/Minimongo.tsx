import { Button, Menu, MenuItem, Popover, Position } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent, useState } from 'react';
import { usePanelStore } from '../../../Stores/PanelStore';
import { Hideable } from '../../../Utils/Hideable';
import { ObjectTree } from '../../../Utils/ObjectTree';
import { StatusBar } from '../../Layout/StatusBar';

interface Props {
  isVisible: boolean;
}

export const Minimongo: FunctionComponent<Props> = observer(({ isVisible }) => {
  const { minimongoStore } = usePanelStore();

  const [activeCollection, setActiveCollection] = useState<null | string>(null);

  const isActiveCollectionMissing =
    activeCollection && !(activeCollection in minimongoStore.collections);

  if (isActiveCollectionMissing) {
    setActiveCollection(null);
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
                    active={activeCollection === key}
                    onClick={() => setActiveCollection(key)}
                  />
                ))}
              </Menu>
            }
            position={Position.RIGHT_TOP}
          >
            <Button
              icon={activeCollection ? 'database' : null}
              text={activeCollection || 'Select Collection'}
            />
          </Popover>
        </div>
      </StatusBar>
    </Hideable>
  );
});

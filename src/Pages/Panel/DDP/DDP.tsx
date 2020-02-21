import React, { FunctionComponent, useRef } from 'react';
import { Classes, Icon } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { Hideable } from '../../../Utils/Hideable';
import { usePanelStore } from '../../../Stores/PanelStore';
import { List } from 'react-virtualized';
import { DDPRow } from './DDPRow';
import { DDPStatus } from './DDPStatus';

const Empty: FunctionComponent = () => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <span className={Classes.TEXT_MUTED}>
      No logs yet... <Icon icon='comment' />
    </span>
  </div>
);

interface Props {
  isVisible: boolean;
}

export const DDP: FunctionComponent<Props> = observer(({ isVisible }) => {
  const listRef = useRef<List>(null);

  const store = usePanelStore();

  listRef?.current?.forceUpdateGrid();

  const Renderer = DDPRow(store);

  return (
    <Hideable isVisible={isVisible}>
      <List
        height={window.innerHeight - 120}
        rowCount={store.ddp.length}
        rowHeight={30}
        width={window.innerWidth}
        className='mde-ddp'
        rowRenderer={props => (
          <Renderer
            newDdpLogs={store.newDdpLogs}
            bookmarkIds={store.bookmarkIds}
            {...props}
          />
        )}
        autoWidth
        overscanRowCount={50}
      />

      <DDPStatus store={store} />
    </Hideable>
  );
});

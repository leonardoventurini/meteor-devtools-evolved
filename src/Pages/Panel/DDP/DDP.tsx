import React, { FunctionComponent, useRef } from 'react';
import { Button, Classes, Icon, Popover, Tag } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { Hideable } from '../../../Utils/Hideable';
import { usePanelStore } from '../../../Stores/PanelStore';
import prettyBytes from 'pretty-bytes';
import { DDPFilterMenu } from './DDPFilterMenu';
import { Position } from '@blueprintjs/core/lib/esm/common/position';
import { List } from 'react-virtualized';
import { DDPRow } from './DDPRow';

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
        ref={listRef}
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

      <div className='mde-layout__status'>
        <div className='mde-layout__status__filter'>
          <Popover content={<DDPFilterMenu />} position={Position.RIGHT_TOP}>
            <Button icon='filter' text='Filter' />
          </Popover>
        </div>

        {store.isLoading && (
          <Tag minimal round style={{ marginRight: 10 }}>
            Loading...
          </Tag>
        )}

        <Tag minimal round style={{ marginRight: 10 }}>
          <Icon
            icon='cloud-download'
            style={{ marginRight: 4, marginBottom: 1 }}
            iconSize={12}
          />
          {prettyBytes(store.inboundBytes)}
        </Tag>

        <Tag minimal round style={{ marginRight: 10 }}>
          <Icon
            icon='cloud-upload'
            style={{ marginRight: 4, marginBottom: 1 }}
            iconSize={12}
          />
          {prettyBytes(store.outboundBytes)}
        </Tag>

        <Tag
          intent='warning'
          minimal
          round
          style={{ marginRight: 10 }}
          interactive
          onClick={() => store.clearLogs()}
        >
          <Icon
            icon='inbox'
            style={{ marginRight: 4, marginBottom: 1 }}
            iconSize={12}
          />
          {store?.ddp.length}
        </Tag>
      </div>
    </Hideable>
  );
});

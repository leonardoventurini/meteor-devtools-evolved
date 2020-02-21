import React, { FunctionComponent, useRef } from 'react';
import { Button, Classes, Icon, Popover, Tag } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { Hideable } from '../../../Utils/Hideable';
import { usePanelStore } from '../../../Stores/PanelStore';
import prettyBytes from 'pretty-bytes';
import { DDPFilterMenu } from './DDPFilterMenu';
import { Position } from '@blueprintjs/core/lib/esm/common/position';
import { FixedSizeList } from 'react-window';
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
  const listRef = useRef(null);

  const store = usePanelStore();

  return (
    <Hideable isVisible={isVisible}>
      <FixedSizeList
        itemData={{ items: store.ddp }}
        height={window.innerHeight - 120}
        itemCount={store.ddp.length}
        itemSize={30}
        ref={listRef}
        width={'100%'}
        className='mde-ddp'
        overscanCount={50}
      >
        {DDPRow(store)}
      </FixedSizeList>

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

        <Tag minimal round style={{ marginRight: 10 }}>
          <Icon
            icon='vertical-bar-chart-asc'
            style={{ marginRight: 4, marginBottom: 1 }}
            iconSize={12}
          />
          {store?.ddp.length}
        </Tag>

        <Button
          intent='none'
          minimal
          onClick={() => {
            store?.clearLogs();
          }}
        >
          <Icon icon='disable' />
        </Button>
      </div>
    </Hideable>
  );
});

import React, { FormEvent, FunctionComponent } from 'react';
import { Button, Icon, InputGroup, Popover, Tag } from '@blueprintjs/core';
import { DDPFilterMenu } from './DDPFilterMenu';
import { Position } from '@blueprintjs/core/lib/esm/common/position';
import prettyBytes from 'pretty-bytes';
import { PanelStoreConstructor } from '../../../Stores/PanelStore';
import { observer } from 'mobx-react-lite';

interface Props {
  store: PanelStoreConstructor;
  pagination: Pagination;
}

export const DDPStatus: FunctionComponent<Props> = observer(
  ({ store, pagination }) => (
    <div className='mde-layout__status'>
      <div className='mde-layout__status__filter'>
        <Popover content={<DDPFilterMenu />} position={Position.RIGHT_TOP}>
          <Button icon='filter' text='Filter' />
        </Popover>

        <InputGroup
          leftIcon='search'
          placeholder='Search...'
          onChange={(event: FormEvent<HTMLInputElement>) =>
            store.setSearch(event.currentTarget.value)
          }
        />
      </div>

      {store.isLoading && (
        <Tag minimal round style={{ marginRight: 10 }}>
          Loading...
        </Tag>
      )}

      <Tag // In-bytes
        minimal
        round
        style={{ marginRight: 10 }}
      >
        <Icon
          icon='cloud-download'
          style={{ marginRight: 4, marginBottom: 1 }}
          iconSize={12}
        />
        {prettyBytes(store.inboundBytes)}
      </Tag>

      <Tag // Out-bytes
        minimal
        round
        style={{ marginRight: 10 }}
      >
        <Icon
          icon='cloud-upload'
          style={{ marginRight: 4, marginBottom: 1 }}
          iconSize={12}
        />
        {prettyBytes(store.outboundBytes)}
      </Tag>

      <Tag // Count & Clear
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

      <Button // Next Page
        minimal
        onClick={pagination.next}
        disabled={!pagination.hasNextPage}
        icon='fast-backward'
        style={{ marginRight: 10 }}
      />

      <Button // Previous Page
        minimal
        onClick={pagination.prev}
        disabled={!pagination.hasPreviousPage}
        icon='fast-forward'
      />
    </div>
  ),
);

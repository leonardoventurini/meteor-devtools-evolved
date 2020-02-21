import React, { FunctionComponent } from 'react';
import { Button, Icon, Popover, Tag } from '@blueprintjs/core';
import { DDPFilterMenu } from './DDPFilterMenu';
import { Position } from '@blueprintjs/core/lib/esm/common/position';
import prettyBytes from 'pretty-bytes';
import { PanelStoreConstructor } from '../../../Stores/PanelStore';

interface Props {
  store: PanelStoreConstructor;
  pagination: Pagination;
}

export const DDPStatus: FunctionComponent<Props> = ({ store, pagination }) => (
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

    <Button
      minimal
      onClick={pagination.next}
      disabled={!pagination.hasNextPage}
      icon='fast-backward'
      style={{ marginRight: 10 }}
    />

    <Button
      minimal
      onClick={pagination.prev}
      disabled={!pagination.hasPreviousPage}
      icon='fast-forward'
    />
  </div>
);

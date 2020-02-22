import React, { FormEvent, FunctionComponent } from 'react';
import {
  Button,
  Icon,
  InputGroup,
  Popover,
  Spinner,
  Tag,
} from '@blueprintjs/core';
import { DDPFilterMenu } from './DDPFilterMenu';
import { Position } from '@blueprintjs/core/lib/esm/common/position';
import prettyBytes from 'pretty-bytes';
import { observer } from 'mobx-react-lite';
import { DDPStore } from '../../../Stores/Panel/DDPStore';

interface Props {
  store: DDPStore;
  pagination: Pagination;
}

export const DDPStatus: FunctionComponent<Props> = observer(
  ({ store, pagination }) => (
    <div className='mde-layout__status'>
      <div className='mde-layout__status__filter'>
        <Popover
          content={<DDPFilterMenu store={store} />}
          position={Position.RIGHT_TOP}
        >
          <Button icon='filter' text='Filter' />
        </Popover>

        <InputGroup
          leftIcon='search'
          placeholder='Search...'
          onChange={(event: FormEvent<HTMLInputElement>) =>
            store.setSearch(event.currentTarget.value)
          }
        />

        <Tag minimal round>
          <Icon icon='eye-open' style={{ marginRight: 8 }} />
          {pagination.pageItems + ' of ' + pagination.length}
        </Tag>
      </div>

      {store.isLoading && (
        <div style={{ marginRight: 8 }}>
          <Spinner size={16} intent='warning' />
        </div>
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
        {store?.collection.length}
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

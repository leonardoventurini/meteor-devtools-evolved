import React, { FunctionComponent } from 'react';
import { Spinner } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { DDPStore } from '../../../../Stores/Panel/DDPStore';
import { StatusBar } from '../../../Layout/StatusBar';
import { OutboundBytesIndicator } from './OutboundBytesIndicator';
import { InboundBytesIndicator } from './InboundBytesIndicator';
import { CountIndicator } from './CountIndicator';
import { PaginationControls } from './PaginationControls';
import { FilterControls } from './FilterControls';

interface Props {
  store: DDPStore;
  pagination: Pagination;
}

export const DDPStatus: FunctionComponent<Props> = observer(
  ({ store, pagination }) => (
    <StatusBar>
      <FilterControls
        activeFilters={store.activeFilters}
        setFilter={store.setFilter.bind(store)}
        setSearch={store.setSearch.bind(store)}
        pagination={store.pagination}
      />

      {store.isLoading && (
        <div style={{ marginRight: 8 }}>
          <Spinner size={16} intent='warning' />
        </div>
      )}

      <InboundBytesIndicator inboundBytes={store.inboundBytes} />

      <OutboundBytesIndicator outboundBytes={store.outboundBytes} />

      <CountIndicator
        count={store.collection.length}
        clear={store.clearLogs.bind(store)}
      />

      <PaginationControls pagination={pagination} />
    </StatusBar>
  ),
);

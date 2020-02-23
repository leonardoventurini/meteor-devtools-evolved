import React, { FunctionComponent } from 'react';
import { Spinner } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { StatusBar } from '../../../Layout/StatusBar';
import { OutboundBytesIndicator } from './OutboundBytesIndicator';
import { InboundBytesIndicator } from './InboundBytesIndicator';
import { CountIndicator } from './CountIndicator';
import { PaginationControls } from './PaginationControls';
import { FilterControls } from './FilterControls';
import { isNumber } from 'lodash';

interface Props {
  activeFilters: FilterTypeMap<boolean>;
  collectionLength?: number;
  inboundBytes?: number;
  isLoading?: boolean;
  outboundBytes?: number;
  pagination: Pagination;
  clearLogs: () => void;
  setFilter: (filter: FilterType, isEnabled: boolean) => void;
  setSearch: (search: string) => void;
}

export const DDPStatus: FunctionComponent<Props> = observer(
  ({
    activeFilters,
    clearLogs,
    collectionLength,
    inboundBytes,
    isLoading,
    outboundBytes,
    pagination,
    setFilter,
    setSearch,
  }) => (
    <StatusBar>
      <FilterControls
        activeFilters={activeFilters}
        setFilter={setFilter}
        setSearch={setSearch}
        pagination={pagination}
      />

      {isLoading && (
        <div style={{ marginRight: 8 }}>
          <Spinner size={16} intent='warning' />
        </div>
      )}

      {!!inboundBytes && <InboundBytesIndicator inboundBytes={inboundBytes} />}

      {!!outboundBytes && (
        <OutboundBytesIndicator outboundBytes={outboundBytes} />
      )}

      {isNumber(collectionLength) && (
        <CountIndicator count={collectionLength} clear={clearLogs} />
      )}

      <PaginationControls pagination={pagination} />
    </StatusBar>
  ),
);

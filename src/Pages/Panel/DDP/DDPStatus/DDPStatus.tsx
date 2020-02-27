import { PaginationControls } from '@/Pages/Layout/PaginationControls';
import { StatusBar } from '@/Pages/Layout/StatusBar';
import { Spinner } from '@blueprintjs/core';
import { isNumber } from 'lodash';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from 'react';
import { CountIndicator } from './CountIndicator';
import { FilterControls } from './FilterControls';
import { InboundBytesIndicator } from './InboundBytesIndicator';
import { OutboundBytesIndicator } from './OutboundBytesIndicator';

interface Props {
  activeFilters: FilterTypeMap<boolean>;
  collectionLength?: number;
  inboundBytes?: number;
  isLoading?: boolean;
  outboundBytes?: number;
  pagination: Pagination;
  clearLogs?: () => void;
  setFilter: (filter: FilterType, isEnabled: boolean) => void;
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
  }) => (
    <StatusBar>
      <FilterControls
        activeFilters={activeFilters}
        setFilter={setFilter}
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

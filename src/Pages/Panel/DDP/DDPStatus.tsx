import { Icon, Spinner } from '@blueprintjs/core';
import { isNumber } from 'lodash';
import { observer } from 'mobx-react-lite';
import React, { FormEvent, FunctionComponent } from 'react';
import { CountIndicator } from '@/Components/CountIndicator';
import { InboundBytesIndicator } from '@/Components/InboundBytesIndicator';
import { OutboundBytesIndicator } from '@/Components/OutboundBytesIndicator';
import { usePanelStore } from '@/Stores/PanelStore';
import { StatusBar } from '@/Components/StatusBar/StatusBar';
import { DDPFilterMenu } from '@/Pages/Panel/DDP/DDPFilterMenu';
import { Position } from '@blueprintjs/core/lib/esm/common/position';
import { Search } from '@/Components/StatusBar/Search';
import { PopoverButton } from '@/Components/PopoverButton';
import { STATUS_HEIGHT } from '@/Styles/Constants';

export const DDPStatus: FunctionComponent = observer(() => {
  const store = usePanelStore();
  const { ddpStore } = store;

  const activeFilters = store.settingStore.activeFilters;
  const setFilter = store.settingStore.setFilter.bind(store.settingStore);
  const clearLogs = ddpStore.clearLogs.bind(ddpStore);
  const collectionLength = ddpStore.collection.length;
  const { inboundBytes, outboundBytes, isLoading, pagination } = ddpStore;

  return (
    <StatusBar>
      <div className='left-group'>
        <PopoverButton
          icon='filter'
          height={28}
          content={
            <DDPFilterMenu
              setFilter={setFilter}
              activeFilters={activeFilters}
            />
          }
          position={Position.RIGHT_TOP}
        >
          Filter
        </PopoverButton>

        <Search
          icon='search'
          placeholder='Search...'
          onChange={(event: FormEvent<HTMLInputElement>) =>
            pagination.setSearch(event.currentTarget.value)
          }
        />

        <small>
          <Icon icon='eye-open' style={{ marginRight: 8 }} />
          {pagination.length}
        </small>
      </div>

      <div className='right-group'>
        {isLoading && (
          <div style={{ marginRight: 8 }}>
            <Spinner size={16} intent='warning' />
          </div>
        )}

        {!!inboundBytes && (
          <InboundBytesIndicator inboundBytes={inboundBytes} />
        )}

        {!!outboundBytes && (
          <OutboundBytesIndicator outboundBytes={outboundBytes} />
        )}

        {isNumber(collectionLength) && (
          <CountIndicator count={collectionLength} clear={clearLogs} />
        )}
      </div>
    </StatusBar>
  );
});

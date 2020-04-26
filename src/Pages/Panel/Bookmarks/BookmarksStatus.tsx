import { Button, Icon, Popover } from '@blueprintjs/core';
import { isNumber } from 'lodash';
import { observer } from 'mobx-react-lite';
import React, { FormEvent, FunctionComponent } from 'react';

import { usePanelStore } from '@/Stores/PanelStore';
import { StatusBar } from '@/Components/StatusBar/StatusBar';
import { DDPFilterMenu } from '@/Pages/Panel/DDP/DDPFilterMenu';
import { Position } from '@blueprintjs/core/lib/esm/common/position';
import { Search } from '@/Components/StatusBar/Search';
import { CountIndicator } from '@/Components/CountIndicator';

export const BookmarksStatus: FunctionComponent = observer(() => {
  const store = usePanelStore();
  const { bookmarkStore } = store;

  const activeFilters = store.settingStore.activeFilters;
  const setFilter = store.settingStore.setFilter.bind(store.settingStore);
  const clearLogs = bookmarkStore.clearLogs.bind(bookmarkStore);
  const collectionLength = bookmarkStore.collection.length;
  const { pagination } = bookmarkStore;

  return (
    <StatusBar>
      <div className='filter-controls'>
        <Popover
          content={
            <DDPFilterMenu
              setFilter={setFilter}
              activeFilters={activeFilters}
            />
          }
          position={Position.RIGHT_TOP}
        >
          <Button icon='filter' text='Filter' />
        </Popover>

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

      {isNumber(collectionLength) && (
        <CountIndicator count={collectionLength} clear={clearLogs} />
      )}
    </StatusBar>
  );
});

import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { Travolta } from '@/Utils/Travolta';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from 'react';
import { DDPLog } from '../DDP/DDPLog';
import { DDPStatus } from '../DDP/DDPStatus/DDPStatus';

interface Props {
  isVisible: boolean;
}

export const Bookmarks: FunctionComponent<Props> = observer(({ isVisible }) => {
  const store = usePanelStore();
  const pageStore = store.bookmarkStore;

  const logs = pageStore.paginated.map(({ log }) => (
    <DDPLog
      key={log.id}
      store={store}
      log={log}
      isNew={false}
      isStarred={pageStore.bookmarkIds.includes(log.id)}
      {...log}
    />
  ));

  return (
    <Hideable isVisible={isVisible}>
      <div className='mde-content mde-ddp'>
        {logs?.length ? logs : <Travolta />}
      </div>

      <DDPStatus
        activeFilters={pageStore.activeFilters}
        collectionLength={pageStore.collection.length}
        isLoading={pageStore.isLoading}
        pagination={pageStore.pagination}
        setFilter={pageStore.setFilter.bind(pageStore)}
      />
    </Hideable>
  );
});

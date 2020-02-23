import React, { FunctionComponent } from 'react';
import { DDPLog } from './DDPLog';
import { observer } from 'mobx-react-lite';
import { Hideable } from '../../../Utils/Hideable';
import { usePanelStore } from '../../../Stores/PanelStore';
import { DDPStatus } from './DDPStatus/DDPStatus';
import { Travolta } from '../../../Utils/Travolta';

interface Props {
  isVisible: boolean;
}

export const DDP: FunctionComponent<Props> = observer(({ isVisible }) => {
  const store = usePanelStore();
  const pageStore = store.ddpStore;

  const logs = store.ddpStore.paginated.map(log => (
    <DDPLog
      key={log.id}
      store={store}
      log={log}
      isNew={store.ddpStore.newLogs.includes(log.id)}
      isStarred={store.bookmarkStore.bookmarkIds.includes(log.id)}
      {...log}
    />
  ));

  return (
    <Hideable isVisible={isVisible}>
      <div className='mde-ddp'>{logs?.length ? logs : <Travolta />}</div>

      <DDPStatus
        activeFilters={store.ddpStore.activeFilters}
        clearLogs={store.ddpStore.clearLogs.bind(store.ddpStore)}
        collectionLength={store.ddpStore.collection.length}
        inboundBytes={store.ddpStore.inboundBytes}
        isLoading={store.ddpStore.isLoading}
        outboundBytes={store.ddpStore.outboundBytes}
        pagination={store.ddpStore.pagination}
        setFilter={store.ddpStore.setFilter.bind(store.ddpStore)}
        setSearch={store.ddpStore.setSearch.bind(store.ddpStore)}
      />
    </Hideable>
  );
});

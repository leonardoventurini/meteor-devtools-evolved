import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { Travolta } from '@/Utils/Travolta';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from 'react';
import { DDPLog } from './DDPLog';
import { DDPStatus } from './DDPStatus/DDPStatus';

interface Props {
  isVisible: boolean;
}

export const DDP: FunctionComponent<Props> = observer(({ isVisible }) => {
  const store = usePanelStore();
  const pageStore = store.ddpStore;

  const logs = pageStore.paginated.map(log => (
    <DDPLog
      key={log.id}
      store={store}
      log={log}
      isNew={pageStore.newLogs.includes(log.id)}
      isStarred={store.bookmarkStore.bookmarkIds.includes(log.id)}
      {...log}
    />
  ));

  return (
    <Hideable isVisible={isVisible}>
      <div className='mde-content mde-ddp'>
        {logs?.length ? logs : <Travolta />}
      </div>

      <DDPStatus
        activeFilters={store.settingStore.activeFilters}
        clearLogs={pageStore.clearLogs.bind(pageStore)}
        collectionLength={pageStore.collection.length}
        inboundBytes={pageStore.inboundBytes}
        isLoading={pageStore.isLoading}
        outboundBytes={pageStore.outboundBytes}
        pagination={pageStore.pagination}
        setFilter={store.settingStore.setFilter.bind(store.settingStore)}
      />
    </Hideable>
  );
});

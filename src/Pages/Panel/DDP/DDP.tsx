import React, { FunctionComponent } from 'react';
import { DDPLog } from './DDPLog';
import { observer } from 'mobx-react-lite';
import { Hideable } from '../../../Utils/Hideable';
import { usePanelStore } from '../../../Stores/PanelStore';
import { DDPStatus } from './DDPStatus';
import { Travolta } from '../../../Utils/Travolta';

interface Props {
  isVisible: boolean;
}

export const DDP: FunctionComponent<Props> = observer(({ isVisible }) => {
  const store = usePanelStore();

  const logs = store.ddpStore.paginatedFilteredLogsCollection.map(log => (
    <DDPLog
      key={log.id}
      store={store}
      log={log}
      isNew={store.ddpStore.newLogs.includes(log.id)}
      isStarred={store.bookmarkIds.includes(log.id)}
      {...log}
    />
  ));

  return (
    <Hideable isVisible={isVisible}>
      <div className='mde-ddp'>{logs?.length ? logs : <Travolta />}</div>

      <DDPStatus
        store={store.ddpStore}
        pagination={store.ddpStore.pagination}
      />
    </Hideable>
  );
});

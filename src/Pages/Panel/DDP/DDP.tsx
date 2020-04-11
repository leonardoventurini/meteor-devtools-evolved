import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from 'react';
import { DDPStatus } from './DDPStatus/DDPStatus';
import { DDPContainer } from '@/Pages/Panel/DDP/DDPContainer';

interface Props {
  isVisible: boolean;
}

export const DDP: FunctionComponent<Props> = observer(({ isVisible }) => {
  const store = usePanelStore();
  const ddpStore = store.ddpStore;

  return (
    <Hideable isVisible={isVisible}>
      <DDPContainer isVisible={isVisible} source={ddpStore} />

      <DDPStatus
        activeFilters={store.settingStore.activeFilters}
        clearLogs={ddpStore.clearLogs.bind(ddpStore)}
        collectionLength={ddpStore.collection.length}
        inboundBytes={ddpStore.inboundBytes}
        isLoading={ddpStore.isLoading}
        outboundBytes={ddpStore.outboundBytes}
        pagination={ddpStore.pagination}
        setFilter={store.settingStore.setFilter.bind(store.settingStore)}
      />
    </Hideable>
  );
});

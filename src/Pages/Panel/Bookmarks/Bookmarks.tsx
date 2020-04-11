import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from 'react';
import { DDPStatus } from '../DDP/DDPStatus/DDPStatus';
import { DDPContainer } from '@/Pages/Panel/DDP/DDPContainer';

interface Props {
  isVisible: boolean;
}

export const Bookmarks: FunctionComponent<Props> = observer(({ isVisible }) => {
  const store = usePanelStore();
  const bookmarkStore = store.bookmarkStore;

  return (
    <Hideable isVisible={isVisible}>
      <DDPContainer isVisible={isVisible} source={bookmarkStore} />

      <DDPStatus
        activeFilters={store.settingStore.activeFilters}
        collectionLength={bookmarkStore.collection.length}
        isLoading={bookmarkStore.isLoading}
        pagination={bookmarkStore.pagination}
        setFilter={store.settingStore.setFilter.bind(store.settingStore)}
      />
    </Hideable>
  );
});

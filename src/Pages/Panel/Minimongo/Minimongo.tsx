import { PaginationControls } from '@/Pages/Layout/PaginationControls';
import { SearchControls } from '@/Pages/Layout/SearchControls';
import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { Button } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent, useState } from 'react';
import { StatusBar } from '../../Layout/StatusBar';
import { MinimongoNavigator } from '@/Pages/Panel/Minimongo/MinimongoNavigator';
import { MinimongoRow } from '@/Pages/Panel/Minimongo/MinimongoRow';

interface Props {
  isVisible: boolean;
}

export const Minimongo: FunctionComponent<Props> = observer(({ isVisible }) => {
  const [showNavigator, setShowNavigator] = useState(false);

  const panelStore = usePanelStore();
  const { minimongoStore } = panelStore;

  const isActiveCollectionMissing =
    minimongoStore.activeCollection &&
    !(minimongoStore.activeCollection in minimongoStore.collections);

  if (isActiveCollectionMissing) {
    minimongoStore.setActiveCollection(null);
  }

  return (
    <Hideable isVisible={isVisible}>
      <div className={'mde-content mde-minimongo'}>
        {minimongoStore.activeCollectionDocuments.paginated.map(
          (document: Document) => (
            <MinimongoRow
              key={document._id}
              document={document}
              panelStore={panelStore}
            />
          ),
        )}
      </div>

      <StatusBar>
        <div className='mde-layout__status__filter'>
          <Button
            icon={minimongoStore.activeCollection ? 'database' : 'asterisk'}
            text={minimongoStore.activeCollection || 'Everything'}
            onClick={() => setShowNavigator(true)}
            disabled={!minimongoStore.collectionNames.length}
          />

          <SearchControls
            pagination={minimongoStore.activeCollectionDocuments.pagination}
          />
        </div>

        <PaginationControls
          pagination={minimongoStore.activeCollectionDocuments.pagination}
        />
      </StatusBar>

      <MinimongoNavigator
        store={minimongoStore}
        isOpen={showNavigator}
        setShowNavigator={setShowNavigator}
      />
    </Hideable>
  );
});

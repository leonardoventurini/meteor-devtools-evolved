import { SearchControls } from '@/Pages/Layout/SearchControls';
import { MinimongoNavigator } from '@/Pages/Panel/Minimongo/MinimongoNavigator';
import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { Button, Menu, MenuItem, NonIdealState } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent, useState } from 'react';
import { StatusBar } from '../../Layout/StatusBar';
import { MinimongoContainer } from '@/Pages/Panel/Minimongo/MinimongoContainer';

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
      <div className={'mde-content'}>
        <div className='minimongo-group'>
          <div className='minimongo-sidebar'>
            <Menu>
              {minimongoStore.filteredCollectionNames.length ? (
                minimongoStore.filteredCollectionNames.map(key => (
                  <MenuItem
                    key={key}
                    icon='database'
                    text={key.concat(
                      ` (${minimongoStore.collections[key]?.length ?? 0})`,
                    )}
                    active={minimongoStore.activeCollection === key}
                    onClick={() => minimongoStore.setActiveCollection(key)}
                  />
                ))
              ) : (
                <div style={{ marginTop: 50, marginBottom: 50 }}>
                  <NonIdealState icon='search' title='No Results' />
                </div>
              )}
            </Menu>
          </div>
          <MinimongoContainer isVisible={isVisible} />
        </div>
      </div>

      <StatusBar>
        <div className='mde-layout__status__filter'>
          <Button
            icon={minimongoStore.activeCollection ? 'database' : 'asterisk'}
            text={minimongoStore.activeCollection || 'Everything'}
            onClick={() => setShowNavigator(true)}
            disabled={!minimongoStore.collectionNames.length}
          />

          {minimongoStore.activeCollection && (
            <Button
              icon='asterisk'
              onClick={() => minimongoStore.setActiveCollection(null)}
            >
              Clear
            </Button>
          )}

          <SearchControls
            pagination={minimongoStore.activeCollectionDocuments.pagination}
          />
        </div>
      </StatusBar>

      <MinimongoNavigator
        store={minimongoStore}
        isOpen={showNavigator}
        setShowNavigator={setShowNavigator}
      />
    </Hideable>
  );
});

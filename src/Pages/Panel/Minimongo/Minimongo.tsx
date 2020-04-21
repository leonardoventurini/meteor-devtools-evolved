import { SearchControls } from '@/Pages/Layout/SearchControls';
import { MinimongoNavigator } from '@/Pages/Panel/Minimongo/MinimongoNavigator';
import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { Button, Icon, Menu, MenuItem } from '@blueprintjs/core';
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
              {!!minimongoStore.collectionNames.length &&
                minimongoStore.collectionNames.map(key => (
                  <MenuItem
                    key={key}
                    text={key.concat(
                      ` (${minimongoStore.collections[key]?.length ?? 0})`,
                    )}
                    active={minimongoStore.activeCollection === key}
                    onClick={() => minimongoStore.setActiveCollection(key)}
                    labelElement={
                      <Icon
                        icon='database'
                        style={{
                          color: minimongoStore.collectionColorMap[key],
                        }}
                      />
                    }
                    style={{
                      marginBottom: 5,
                    }}
                  />
                ))}

              <MenuItem
                text={
                  <strong>
                    All Documents ({minimongoStore.totalDocuments})
                  </strong>
                }
                active={!minimongoStore.activeCollection}
                onClick={() => minimongoStore.setActiveCollection(null)}
              />
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

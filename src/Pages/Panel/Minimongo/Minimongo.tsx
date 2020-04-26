import { MinimongoNavigator } from '@/Pages/Panel/Minimongo/MinimongoNavigator';
import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { Icon, Menu, MenuItem } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import React, { FormEvent, FunctionComponent, useState } from 'react';
import { MinimongoContainer } from '@/Pages/Panel/Minimongo/MinimongoContainer';
import { StatusBar } from '@/Components/StatusBar/StatusBar';
import { Button } from '@/Components/Button';
import { Field } from '@/Components/StatusBar/Field';
import { Search } from '@/Components/StatusBar/Search';

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
        <div className='left-group'>
          <Button
            icon={minimongoStore.activeCollection ? 'database' : 'asterisk'}
            onClick={() => setShowNavigator(true)}
            disabled={!minimongoStore.collectionNames.length}
          >
            {minimongoStore.activeCollection || 'Everything'}
          </Button>

          {minimongoStore.activeCollection && (
            <Button
              icon='asterisk'
              onClick={() => minimongoStore.setActiveCollection(null)}
            >
              Clear
            </Button>
          )}

          <Search
            icon='search'
            placeholder='Search...'
            onChange={(event: FormEvent<HTMLInputElement>) =>
              minimongoStore.activeCollectionDocuments.pagination.setSearch(
                event.currentTarget.value,
              )
            }
          />

          <Field icon='eye-open'>
            {minimongoStore.activeCollectionDocuments.pagination.length}
          </Field>
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

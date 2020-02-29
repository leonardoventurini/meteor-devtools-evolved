import { PaginationControls } from '@/Pages/Layout/PaginationControls';
import { SearchControls } from '@/Pages/Layout/SearchControls';
import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { StringUtils } from '@/Utils/StringUtils';
import {
  Button,
  Classes,
  Dialog,
  InputGroup,
  Menu,
  MenuItem,
  NonIdealState,
  Tag,
} from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import React, { FormEvent, FunctionComponent, useState } from 'react';
import { StatusBar } from '../../Layout/StatusBar';

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
            <div key={document._id} className='mde-minimongo__row'>
              <Tag
                minimal
                interactive
                onClick={() => panelStore.setActiveObject(document)}
              >
                <code>
                  {StringUtils.truncate(JSON.stringify(document), 64)}
                </code>
              </Tag>
            </div>
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

      <Dialog
        icon='database'
        onClose={() => setShowNavigator(false)}
        title='Collections'
        isOpen={showNavigator}
      >
        <div
          className={Classes.DIALOG_BODY}
          style={{ height: '50vh', overflowY: 'scroll' }}
        >
          <Menu>
            {minimongoStore.filteredCollectionNames.length ? (
              minimongoStore.filteredCollectionNames.map(key => (
                <MenuItem
                  key={key}
                  icon='database'
                  text={key}
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
        <div className={Classes.DIALOG_FOOTER}>
          <div style={{ display: 'flex' }}>
            <div style={{ flexGrow: 1, marginRight: 8 }}>
              <InputGroup
                leftIcon='search'
                placeholder='Search...'
                className={Classes.FILL}
                onChange={(event: FormEvent<HTMLInputElement>) =>
                  minimongoStore.setSearch(event.currentTarget.value)
                }
              />
            </div>

            <Button
              icon='asterisk'
              onClick={() => minimongoStore.setActiveCollection(null)}
              active={minimongoStore.activeCollection === null}
            >
              Everything
            </Button>
          </div>
        </div>
      </Dialog>
    </Hideable>
  );
});

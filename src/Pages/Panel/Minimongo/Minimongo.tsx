import { PaginationControls } from '@/Pages/Layout/PaginationControls';
import { SearchControls } from '@/Pages/Layout/SearchControls';
import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { StringUtils } from '@/Utils/StringUtils';
import {
  Button,
  Menu,
  MenuItem,
  Popover,
  Position,
  Tag,
} from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from 'react';
import { StatusBar } from '../../Layout/StatusBar';

interface Props {
  isVisible: boolean;
}

export const Minimongo: FunctionComponent<Props> = observer(({ isVisible }) => {
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
          <Popover
            content={
              <Menu>
                {minimongoStore.collectionNames.map(key => (
                  <MenuItem
                    key={key}
                    icon='database'
                    text={key}
                    active={minimongoStore.activeCollection === key}
                    onClick={() => minimongoStore.setActiveCollection(key)}
                  />
                ))}
              </Menu>
            }
            position={Position.TOP_RIGHT}
            disabled={!minimongoStore.collectionNames.length}
          >
            <Button
              icon={minimongoStore.activeCollection ? 'database' : null}
              text={minimongoStore.activeCollection || 'Select Collection'}
              disabled={!minimongoStore.collectionNames.length}
            />
          </Popover>

          <SearchControls
            pagination={minimongoStore.activeCollectionDocuments.pagination}
          />
        </div>

        <PaginationControls
          pagination={minimongoStore.activeCollectionDocuments.pagination}
        />
      </StatusBar>
    </Hideable>
  );
});

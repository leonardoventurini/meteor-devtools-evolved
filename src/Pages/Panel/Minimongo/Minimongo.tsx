import { MinimongoNavigator } from '@/Pages/Panel/Minimongo/MinimongoNavigator';
import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { Icon, Menu, MenuItem } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from 'react';
import { MinimongoContainer } from '@/Pages/Panel/Minimongo/MinimongoContainer';
import styled from 'styled-components';
import { MinimongoStatus } from '@/Pages/Panel/Minimongo/MinimongoStatus';

interface Props {
  isVisible: boolean;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;

  .sidebar {
    height: 100%;
    width: 222px;
    overflow-y: auto;
    flex-shrink: 0;
    flex-grow: 0;
  }

  .container {
    height: 100%;
    min-width: 0;
    flex-grow: 1;
    flex-shrink: 1;

    .row {
      display: flex;
      align-items: center;
      padding: 5px 15px;

      & > * + * {
        margin-left: 8px;
      }

      .row-collection {
        @include truncate;
        flex-shrink: 0;
        width: 128px;
      }

      .row-preview {
        flex: 0 1 auto;
        @include truncate;
      }
    }
  }
`;

export const Minimongo: FunctionComponent<Props> = observer(({ isVisible }) => {
  const { minimongoStore } = usePanelStore();

  const isActiveCollectionMissing =
    minimongoStore.activeCollection &&
    !(minimongoStore.activeCollection in minimongoStore.collections);

  if (isActiveCollectionMissing) {
    minimongoStore.setActiveCollection(null);
  }

  return (
    <Hideable isVisible={isVisible}>
      <div className={'mde-content'}>
        <Wrapper>
          <div className='sidebar'>
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
        </Wrapper>
      </div>

      <MinimongoStatus />

      <MinimongoNavigator />
    </Hideable>
  );
});

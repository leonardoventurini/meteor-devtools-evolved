import { MinimongoNavigator } from '@/Pages/Panel/Minimongo/MinimongoNavigator';
import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from 'react';
import { MinimongoContainer } from '@/Pages/Panel/Minimongo/MinimongoContainer';
import styled from 'styled-components';
import { MinimongoStatus } from '@/Pages/Panel/Minimongo/MinimongoStatus';
import { Button } from '@/Components/Button';
import { truncate } from '@/Styles/Mixins';
import { StringUtils } from '@/Utils/StringUtils';
import prettyBytes from 'pretty-bytes';

interface Props {
  isVisible: boolean;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;

  .sidebar {
    display: flex;
    height: 100%;
    width: 222px;
    overflow-y: auto;
    font-size: 11px;
    font-family: 'Iosevka Medium', monospace;

    nav {
      display: flex;
      flex: 1;
      flex-direction: column;
      width: 100%;

      button {
        flex: 0 0 20px;
        width: 100%;

        &.active {
          background: rgba(255, 255, 255, 0.15);
        }

        &:hover:not(.active) {
          background: rgba(255, 255, 255, 0.1);
        }

        span {
          ${truncate};
        }
      }
    }
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
            <nav>
              {!!minimongoStore.collectionNames.length &&
                minimongoStore.collectionNames.map(key => (
                  <Button
                    key={key}
                    active={minimongoStore.activeCollection === key}
                    onClick={() => minimongoStore.setActiveCollection(key)}
                    subtitle={
                      minimongoStore.getMetadata(key)?.collectionSizePretty
                    }
                  >
                    {StringUtils.truncate(key, 24).concat(
                      ` (${minimongoStore.collections[key]?.length ?? 0})`,
                    )}
                  </Button>
                ))}

              <Button
                active={!minimongoStore.activeCollection}
                onClick={() => minimongoStore.setActiveCollection(null)}
                subtitle={prettyBytes(minimongoStore.totalSize)}
              >
                All Documents ({minimongoStore.totalDocuments})
              </Button>
            </nav>
          </div>
          <MinimongoContainer isVisible={isVisible} />
        </Wrapper>
      </div>

      <MinimongoStatus />

      <MinimongoNavigator />
    </Hideable>
  );
});

import { MinimongoStore } from '@/Stores/Panel/MinimongoStore';
import {
  Button,
  Classes,
  Dialog,
  InputGroup,
  Menu,
  MenuItem,
  NonIdealState,
} from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import React, { FormEvent, FunctionComponent } from 'react';

interface Props {
  store: MinimongoStore;
  isOpen: boolean;
  setShowNavigator(showNavigator: boolean): void;
}

export const MinimongoNavigator: FunctionComponent<Props> = observer(
  ({ store, isOpen, setShowNavigator }) => {
    const setActiveCollection = (collectionName: string | null) => {
      store.setActiveCollection(collectionName);
      setShowNavigator(false);
    };

    return (
      <Dialog
        icon='database'
        onClose={() => setShowNavigator(false)}
        title='Collections'
        isOpen={isOpen}
      >
        <div
          className={Classes.DIALOG_BODY}
          style={{ height: '50vh', overflowY: 'scroll' }}
        >
          <Menu>
            {store.filteredCollectionNames.length ? (
              store.filteredCollectionNames.map(key => (
                <MenuItem
                  key={key}
                  icon='database'
                  text={key}
                  active={store.activeCollection === key}
                  onClick={() => setActiveCollection(key)}
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
                  store.setSearch(event.currentTarget.value)
                }
              />
            </div>

            <Button
              icon='asterisk'
              onClick={() => setActiveCollection(null)}
              active={store.activeCollection === null}
            >
              Everything
            </Button>
          </div>
        </div>
      </Dialog>
    );
  },
);

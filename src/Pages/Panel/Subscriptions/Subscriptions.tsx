import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from 'react';
import { Cell, Column, Table } from '@blueprintjs/table';

interface Props {
  isVisible: boolean;
}

export const Subscriptions: FunctionComponent<Props> = observer(
  ({ isVisible }) => {
    const panelStore = usePanelStore();
    const subscriptions = Object.values(panelStore.subscriptions);

    console.log({ subscriptions });

    return (
      <Hideable isVisible={isVisible}>
        <Table numRows={subscriptions.length}>
          <Column
            key='name'
            name='Name'
            cellRenderer={(index: number) => (
              <Cell>{subscriptions[index].name}</Cell>
            )}
          />

          <Column
            key='params'
            name='Params'
            cellRenderer={(index: number) => (
              <Cell>{JSON.stringify(subscriptions[index].params)}</Cell>
            )}
          />

          <Column
            key='inactive'
            name='Inactive'
            cellRenderer={(index: number) => (
              <Cell>{JSON.stringify(subscriptions[index].inactive)}</Cell>
            )}
          />

          <Column
            key='ready'
            name='Ready'
            cellRenderer={(index: number) => (
              <Cell>{JSON.stringify(subscriptions[index].ready)}</Cell>
            )}
          />
        </Table>
      </Hideable>
    );
  },
);

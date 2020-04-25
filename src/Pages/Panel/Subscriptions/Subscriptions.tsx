import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from 'react';
import { HTMLTable, Tag } from '@blueprintjs/core';
import styled from 'styled-components';

interface Props {
  isVisible: boolean;
}

const Wrapper = styled.div`
  table {
    width: 100%;

    .truncated {
      max-width: 160px;
    }
  }
`;

export const Subscriptions: FunctionComponent<Props> = observer(
  ({ isVisible }) => {
    const panelStore = usePanelStore();
    const subscriptions = Object.values(panelStore.subscriptions);

    console.log({ subscriptions });

    return (
      <Hideable isVisible={isVisible}>
        <Wrapper className='mde-content'>
          <HTMLTable>
            <thead>
              <tr>
                <th>Name</th>
                <th>Params</th>
                <th>Inactive</th>
                <th>Ready</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(subscription => (
                <tr key={subscription.id}>
                  <td>
                    <Tag minimal>{subscription.name}</Tag>
                  </td>
                  <td>
                    <Tag minimal style={{ maxWidth: 160 }}>
                      {JSON.stringify(subscription.params)}
                    </Tag>
                  </td>
                  <td>
                    <Tag minimal>{JSON.stringify(subscription.inactive)}</Tag>
                  </td>
                  <td>
                    <Tag minimal>{JSON.stringify(subscription.ready)}</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </Wrapper>
      </Hideable>
    );
  },
);

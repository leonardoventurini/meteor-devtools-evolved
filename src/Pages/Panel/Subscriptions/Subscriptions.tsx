import { usePanelStore } from '@/Stores/PanelStore';
import { Hideable } from '@/Utils/Hideable';
import { observer } from 'mobx-react-lite';
import React, { FormEvent, FunctionComponent } from 'react';
import { HTMLTable, Tag } from '@blueprintjs/core';
import styled from 'styled-components';
import { sortBy } from 'lodash';
import { useInterval } from '@/Utils/Hooks/Interval';
import { syncSubscriptions } from '@/Bridge';
import { StatusBar } from '@/Components/StatusBar';
import { Field } from '@/Components/Field';
import { TextInput } from '@/Components/TextInput';

interface Props {
  isVisible: boolean;
}

const Wrapper = styled.div`
  table {
    width: 100%;
  }
`;

export const Subscriptions: FunctionComponent<Props> = observer(
  ({ isVisible }) => {
    useInterval(() => isVisible && syncSubscriptions(), 5000);

    const panelStore = usePanelStore();
    const subscriptions = sortBy(panelStore.subscriptionStore.filtered, 'name');

    return (
      <Hideable isVisible={isVisible}>
        <Wrapper className='mde-content'>
          <HTMLTable condensed interactive>
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
                <tr
                  key={subscription.id}
                  onClick={() =>
                    panelStore.setActiveObject({
                      params: subscription.params,
                    })
                  }
                >
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

        <StatusBar>
          <TextInput
            icon='search'
            placeholder='Search...'
            onChange={(event: FormEvent<HTMLInputElement>) =>
              panelStore.subscriptionStore.pagination.setSearch(
                event.currentTarget.value,
              )
            }
          />

          <div className='right-group'>
            <Field icon='feed-subscribed'>{subscriptions.length}</Field>
          </div>
        </StatusBar>
      </Hideable>
    );
  },
);

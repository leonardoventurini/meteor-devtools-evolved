import React, { FormEvent, FunctionComponent } from 'react';
import { DDPLog } from './DDPLog';
import { Button, Classes, Icon, Switch, Tag } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { Hideable } from '../../../Utils/Hideable';
import { usePanelStore } from '../../../Stores/PanelStore';

const Empty: FunctionComponent = () => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <span className={Classes.TEXT_MUTED}>
      No logs yet... <Icon icon='comment' />
    </span>
  </div>
);

interface Props {
  isVisible: boolean;
}

export const DDP: FunctionComponent<Props> = observer(({ isVisible }) => {
  const store = usePanelStore();

  const logs = store?.ddp.map(log => (
    <DDPLog
      key={log.id}
      store={store}
      log={log}
      isNew={store.newDdpLogs.includes(log.id)}
      isStarred={store.bookmarkIds.includes(log.id)}
    />
  ));

  return (
    <Hideable isVisible={isVisible}>
      <div className='mde-ddp'>{logs?.length ? logs : <Empty />}</div>

      <div className='mde-layout__status'>
        <div className='mde-layout__status__filter'>
          <Switch
            checked={store.activeFilters.heartbeat}
            label='Heartbeat'
            onChange={(event: FormEvent<HTMLInputElement>) =>
              store.setFilter('heartbeat', event.currentTarget.checked)
            }
          />
          <Switch
            checked={store.activeFilters.subscription}
            label='Subscription'
            onChange={(event: FormEvent<HTMLInputElement>) =>
              store.setFilter('subscription', event.currentTarget.checked)
            }
          />
          <Switch
            checked={store.activeFilters.collection}
            label='Collection'
            onChange={(event: FormEvent<HTMLInputElement>) =>
              store.setFilter('collection', event.currentTarget.checked)
            }
          />
          <Switch
            checked={store.activeFilters.method}
            label='Method'
            onChange={(event: FormEvent<HTMLInputElement>) =>
              store.setFilter('method', event.currentTarget.checked)
            }
          />
          <Switch
            checked={store.activeFilters.connection}
            label='Connection'
            onChange={(event: FormEvent<HTMLInputElement>) =>
              store.setFilter('connection', event.currentTarget.checked)
            }
          />
        </div>

        <Tag intent='primary' minimal round>
          {store?.ddpCount}
        </Tag>

        <Button
          intent='danger'
          minimal
          style={{ marginLeft: 10 }}
          onClick={() => {
            store?.clearLogs();
          }}
        >
          <Icon icon='disable' />
        </Button>
      </div>
    </Hideable>
  );
});

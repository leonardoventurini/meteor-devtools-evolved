import React, { FormEvent, FunctionComponent } from 'react';
import { DDPLog } from './DDPLog';
import { Button, Classes, Icon, Switch, Tag } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { Hideable } from '../../../Utils/Hideable';
import { usePanelStore } from '../../../Stores/PanelStore';
import prettyBytes from 'pretty-bytes';

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

  const logs = store?.ddp
    .filter(log => {
      const msg = log?.content?.match(/"msg":"(\w+)"/);

      return !msg || !store.activeFilterBlacklist.includes(msg[1]);
    })
    .map(log => (
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

        <Tag minimal round style={{ marginRight: 10 }}>
          <Icon
            icon='cloud-download'
            style={{ marginRight: 4, marginBottom: 1 }}
            iconSize={12}
          />
          {prettyBytes(store.transferBytes)}
        </Tag>

        <Tag minimal round style={{ marginRight: 10 }}>
          <Icon
            icon='vertical-bar-chart-asc'
            style={{ marginRight: 4, marginBottom: 1 }}
            iconSize={12}
          />
          {store?.ddpCount}
        </Tag>

        <Button
          intent='none'
          minimal
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

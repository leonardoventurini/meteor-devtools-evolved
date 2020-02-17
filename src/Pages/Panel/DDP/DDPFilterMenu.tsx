import React, { FormEvent, FunctionComponent } from 'react';
import { Switch } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { usePanelStore } from '../../../Stores/PanelStore';

export const DDPFilterMenu: FunctionComponent = observer(() => {
  const store = usePanelStore();

  return (
    <div style={{ padding: 10 }}>
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
        style={{ marginBottom: 0 }}
      />
    </div>
  );
});

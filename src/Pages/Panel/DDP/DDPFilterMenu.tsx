import React, { FormEvent, FunctionComponent } from 'react';
import { Switch } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { usePanelStore } from '../../../Stores/PanelStore';
import { FilterCriteria } from './FilterConstants';

export const DDPFilterMenu: FunctionComponent = observer(() => {
  const store = usePanelStore();

  const filters = Object.keys(FilterCriteria).map(filter => (
    <Switch
      key={filter}
      checked={store.activeFilters.heartbeat}
      label={filter.charAt(0).toUpperCase() + filter.slice(1)}
      onChange={(event: FormEvent<HTMLInputElement>) =>
        store.setFilter(filter as FilterType, event.currentTarget.checked)
      }
    />
  ));

  return <div style={{ padding: 10 }}>{filters}</div>;
});
